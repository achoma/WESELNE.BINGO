/**
 * WESELNE BINGO - CORE ENGINE (Vanilla JS)
 * Wersja: 1.1 (Zintegrowana baza IndexedDB dla plików wideo)
 * Architektura: SPA + LocalStorage + IndexedDB + Asynchronous Webhook
 */

/* =========================================
   1. KONFIGURACJA KLIENTA (Zmieniasz tylko to!)
   ========================================= */
const CONFIG = {
    // Adres Webhooka z Make.com (lub Zapier), który odbiera pliki i wrzuca na Google Drive
    webhookUrl: "https://hook.eu1.make.com/a3q28ldn4jiod94tormccogppeq4umj4", 
    
    bingoMessage: "Mamy bingo! Odbierz nagrodę u świadka przy barze!",
    
    // Lista zadań (Docelowo 25. Uzupełnij dla konkretnej pary młodej)
    tasks: [
        { id: 1, title: 'Król Parkietu', desc: 'Wideo z solowego, epickiego popisu tanecznego (szalone obroty i skoki mile widziane!).' },
        { id: 2, title: 'Wzruszenie', desc: 'Uchwyć moment, gdy ktoś z gości ociera łzę wzruszenia.' },
        { id: 3, title: 'Selfie z Teściową', desc: 'Zrób sobie uśmiechnięte zdjęcie z mamą panny młodej lub pana młodego.' },
        // ... DEV HELP: Pętla poniżej automatycznie dobije do 25 na potrzeby testów.
    ]
};

// DEV ONLY: Wypełniacz do pełnych 25 zadań
while(CONFIG.tasks.length < 25) {
    CONFIG.tasks.push({ id: CONFIG.tasks.length + 1, title: `Zadanie ${CONFIG.tasks.length + 1}`, desc: 'Standardowe zadanie weselne...' });
}

/* =========================================
   2. INICJALIZACJA I ZARZĄDZANIE STANEM
   ========================================= */
document.addEventListener('DOMContentLoaded', () => {
    
    // Cache'owanie DOM
    const els = {
        login: document.getElementById('login-screen'),
        app: document.getElementById('app-container'),
        board: document.getElementById('bingo-board'),
        modal: document.getElementById('task-modal'),
        upload: document.getElementById('media-upload'),
        preview: document.getElementById('media-preview'),
        btnComplete: document.getElementById('btn-complete'),
        btnCancel: document.getElementById('btn-cancel'),
        playerName: document.getElementById('player-name'),
        tasksLeft: document.getElementById('tasks-left')
    };

    let state = JSON.parse(localStorage.getItem('bingoState')) || null;
    let activeIndex = null;

    if (state && state.name) {
        renderApp();
    }

/* =========================================
   3. LOGIKA STARTU (Logowanie i tasowanie)
   ========================================= */
    document.getElementById('start-btn').addEventListener('click', () => {
        const nameInput = document.getElementById('name-input').value.trim();
        if (!nameInput) {
            alert('Proszę, podaj swoje imię, abyśmy wiedzieli czyje to zadania!');
            return;
        }
        
        let shuffledTasks = [...CONFIG.tasks].sort(() => Math.random() - 0.5);
        
        state = { 
            name: nameInput, 
            board: shuffledTasks.map(t => ({ ...t, done: false, media: null })) 
        };
        
        saveState();
        renderApp();
    });

/* =========================================
   4. RENDEROWANIE INTERFEJSU
   ========================================= */
    function renderApp() {
        els.login.classList.add('hidden');
        els.app.classList.remove('hidden');
        els.playerName.innerText = state.name;
        
        els.board.innerHTML = '';
        let doneCount = 0;

        state.board.forEach((task, index) => {
            if (task.done) doneCount++;
            
            const tile = document.createElement('div');
            tile.className = `tile ${task.done ? 'done' : ''}`;
            tile.innerText = index + 1; 
            
            tile.addEventListener('click', () => openModal(index));
            els.board.appendChild(tile);
        });

        els.tasksLeft.innerText = 25 - doneCount;
        requestAnimationFrame(() => checkBingo());
    }

/* =========================================
   5. OBSŁUGA MODALA I RENDEROWANIE PODGLĄDU
   ========================================= */
    function openModal(index) {
        activeIndex = index;
        const task = state.board[index];
        
        document.getElementById('modal-title').innerText = task.title;
        document.getElementById('modal-desc').innerText = task.desc;
        
        if (task.done) {
            els.btnComplete.innerText = "COFNIJ ZADANIE (POMYŁKA)";
            els.upload.classList.add('hidden'); 
            els.preview.classList.remove('hidden'); 
            
            // SECURITY & STABILITY: Odczyt danych z różnych źródeł (Base64 vs IndexedDB)
            if (task.media && task.media.startsWith('data:image')) {
                // 1. Zwykłe zdjęcie
                els.preview.innerHTML = `<img src="${task.media}" style="max-width: 100%; border-radius: var(--radius, 8px); margin-bottom: 20px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);" />`;
            
            } else if (task.media && task.media.startsWith('idb:')) {
                // 2. Odtwarzacz Wideo ładowany asynchronicznie z pamięci IndexedDB
                const videoKey = task.media.replace('idb:', '');
                els.preview.innerHTML = '<p style="margin-bottom:20px; color:#555;"><i>Ładowanie wideo z pamięci telefonu...</i></p>';
                
                getMediaFromDB(videoKey).then(blob => {
                    if (blob) {
                        const vidUrl = URL.createObjectURL(blob);
                        els.preview.innerHTML = `<video src="${vidUrl}" controls playsinline style="max-width: 100%; border-radius: var(--radius, 8px); box-shadow: 0 4px 10px rgba(0,0,0,0.1); margin-bottom: 20px;"></video>`;
                    } else {
                        els.preview.innerHTML = '<p style="margin-bottom:20px; color: #d9534f;"><i>Plik wideo został usunięty przez system operacyjny (brak miejsca).</i></p>';
                    }
                });

            } else if (task.media && task.media.startsWith('blob:')) {
                els.preview.innerHTML = '<p style="margin-bottom:20px; color: #d9534f;"><i>Stare zdjęcie testowe. Kliknij "Cofnij zadanie".</i></p>';
            } else {
                els.preview.innerHTML = '<p style="margin-bottom:20px; color: #555;"><i>Plik zabezpieczony na serwerze Młodych. Podgląd na żywo niedostępny.</i></p>';
            }
        } else {
            els.btnComplete.innerText = "OZNACZ JAKO WYKONANE";
            els.upload.classList.remove('hidden'); 
            els.upload.value = ''; 
            els.preview.classList.add('hidden'); 
            els.preview.innerHTML = ''; 
        }

        els.modal.showModal();
    }

    els.btnCancel.addEventListener('click', () => els.modal.close());

/* =========================================
   6. WYSYŁKA PLIKÓW I OBSŁUGA COFANIA
   ========================================= */
    els.btnComplete.addEventListener('click', async () => {
        const task = state.board[activeIndex];
        
        if (task.done) {
            // Zwalnianie pamięci z potężnych plików wideo po cofnięciu zadania
            if (task.media && task.media.startsWith('idb:')) {
                await deleteMediaFromDB(task.media.replace('idb:', ''));
            }
            task.done = false;
            task.media = null; 
        } else {
            if (els.upload.files.length === 0) {
                alert('Zaraz, zaraz! Musisz załączyć zdjęcie lub wideo jako dowód.');
                return;
            }
            
            let file = els.upload.files[0];
            const originalBtnText = els.btnComplete.innerText;
            const isVideo = file.type.startsWith('video/'); 
            
            els.btnComplete.disabled = true;

            // 1. ZAPIS DO ODPOWIEDNIEJ BAZY DANYCH
            let localMediaRef = null;
            if (isVideo) {
                // WIDEO omija localStorage i trafia bezpiecznie do IndexedDB
                els.btnComplete.innerText = "PRZETWARZANIE WIDEO...";
                const videoKey = `video_${task.id}`;
                await saveMediaToDB(videoKey, file);
                localMediaRef = `idb:${videoKey}`; 
            } else {
                // ZDJĘCIE standardowo jako lekka miniatura w Base64
                localMediaRef = await generateThumbnail(file);
            }

            // 2. KOMPRESJA I WERYFIKACJA WAGI
            if (!isVideo) {
                els.btnComplete.innerText = "KOMPRESOWANIE... PROSZĘ CZEKAĆ";
                file = await compressImage(file, 1920, 0.8); 
            } else if (file.size > 50 * 1024 * 1024) {
                alert("Ten film jest za duży! Maksymalny dopuszczalny rozmiar to 50MB.");
                await deleteMediaFromDB(`video_${task.id}`); // Sprzątamy zablokowany film
                els.btnComplete.disabled = false;
                els.btnComplete.innerText = originalBtnText;
                return; 
            }
            
            els.btnComplete.innerText = "WYSYŁANIE... PROSZĘ CZEKAĆ";

            // 3. WYSYŁKA DO WEBHOOKA
            try {
                const formData = new FormData();
                formData.append("file", file);
                formData.append("guest_name", state.name);
                formData.append("task_title", task.title);
                formData.append("task_id", task.id);

                const response = await fetch(CONFIG.webhookUrl, {
                    method: "POST",
                    body: formData
                });

                if (response.ok) {
                    task.done = true;
                    task.media = localMediaRef; 
                } else {
                    throw new Error("Odmowa serwera");
                }
            } catch (error) {
                console.error("Upload error:", error);
                alert("Nie udało się wysłać pliku. Sprawdź połączenie z internetem lub spróbuj mniejszy plik.");
                if (isVideo) await deleteMediaFromDB(`video_${task.id}`); // Sprzątamy na wypadek błędu sieci
                els.btnComplete.innerText = originalBtnText;
                els.btnComplete.disabled = false;
                return; 
            }

            els.btnComplete.disabled = false;
        }

        saveState();
        els.modal.close();
        renderApp();
    });

/* =========================================
   7. SILNIK BINGO (Matematyka planszy)
   ========================================= */
    function checkBingo() {
        const lines = [
            [0,1,2,3,4], [5,6,7,8,9], [10,11,12,13,14], [15,16,17,18,19], [20,21,22,23,24],
            [0,5,10,15,20], [1,6,11,16,21], [2,7,12,17,22], [3,8,13,18,23], [4,9,14,19,24],
            [0,6,12,18,24], [4,8,12,16,20]
        ];

        for (let line of lines) {
            if (line.every(index => state.board[index].done)) {
                if (!localStorage.getItem('bingoWon')) {
                    setTimeout(() => alert(CONFIG.bingoMessage), 200); 
                    localStorage.setItem('bingoWon', 'true');
                }
                return; 
            }
        }
    }

    function saveState() {
        localStorage.setItem('bingoState', JSON.stringify(state));
    }

/* =========================================
   8. SNIPPETY NARZĘDZIOWE (Kompresja, Miniatury, IndexedDB)
   ========================================= */
    
    // --- INDEXED-DB (Obsługa ciężkich plików offline) ---
    const initDB = () => {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('BingoDB', 1);
            request.onupgradeneeded = (e) => e.target.result.createObjectStore('mediaStore');
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject('Błąd bazy IndexedDB');
        });
    };

    const saveMediaToDB = async (key, blob) => {
        const db = await initDB();
        return new Promise((resolve) => {
            const tx = db.transaction('mediaStore', 'readwrite');
            tx.objectStore('mediaStore').put(blob, key);
            tx.oncomplete = () => resolve(true);
        });
    };

    const getMediaFromDB = async (key) => {
        const db = await initDB();
        return new Promise((resolve) => {
            const tx = db.transaction('mediaStore', 'readonly');
            const req = tx.objectStore('mediaStore').get(key);
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => resolve(null);
        });
    };

    const deleteMediaFromDB = async (key) => {
        const db = await initDB();
        const tx = db.transaction('mediaStore', 'readwrite');
        tx.objectStore('mediaStore').delete(key);
    };

    // --- KOMPRESJA I MINIATURY ---
    const compressImage = (file, maxWidth = 1920, quality = 0.8) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file); 
            
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas'); 
                    let width = img.width;
                    let height = img.height;
                    if (width > maxWidth) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    }
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height); 
                    canvas.toBlob((blob) => {
                        resolve(new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() })); 
                    }, 'image/jpeg', quality); 
                };
            };
        });
    };

    const generateThumbnail = (file) => {
        return new Promise((resolve) => {
            const objectUrl = URL.createObjectURL(file);
            if (file.type.startsWith('image/')) {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 300;
                    let width = img.width, height = img.height;
                    if (width > MAX_WIDTH) { height = Math.round((height * MAX_WIDTH) / width); width = MAX_WIDTH; }
                    canvas.width = width; canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    const base64Thumbnail = canvas.toDataURL('image/jpeg', 0.5);
                    URL.revokeObjectURL(objectUrl);
                    resolve(base64Thumbnail); 
                };
                img.onerror = () => { URL.revokeObjectURL(objectUrl); resolve("error"); };
                img.src = objectUrl;
            } else {
                URL.revokeObjectURL(objectUrl);
                resolve(null);
            }
        });
    };
});