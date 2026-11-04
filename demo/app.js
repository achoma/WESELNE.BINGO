/**
 * WESELNE BINGO - CORE ENGINE (Vanilla JS) - WERSJA DEMO
 * Cel: Izolowany system testowy (symulacja bazy, zero zapytań API).
 */

const CONFIG = {
    // Brak webhooka Make.com - to jest odizolowane demo.
    bingoMessage: "Mamy bingo! Odbierz nagrodę u świadka!",
    
    tasks: [
        { id: 1, title: 'Selfie ze Świadkową', desc: 'Znajdź prawą rękę Panny Młodej i zróbcie sobie pamiątkowe, uśmiechnięte zdjęcie.' },
        { id: 2, title: 'Toast za miłość!', desc: 'Uwiecznij na zdjęciu moment, w którym wznosisz toast (nawet wodą!) z rodzicami Pary Młodej.' },
        { id: 3, title: 'Stylowy detal', desc: 'Zrób zdjęcie najpiękniejszej Twoim zdaniem dekoracji na sali weselnej.' },
        { id: 4, title: 'Słodkie chwile', desc: 'Sfotografuj swój ulubiony deser ze słodkiego stołu – oczywiście zanim go zjesz!' },
        { id: 5, title: 'Pokolenia na parkiecie', desc: 'Zrób sobie zdjęcie podczas tańca z jednym z najstarszych gości na weselu.' },
        { id: 6, title: 'Kolorowy zawrót głowy', desc: 'Znajdź kogoś, kto ma na sobie element ubioru w tym samym kolorze co Ty, i zróbcie wspólne selfie.' },
        { id: 7, title: 'Pocałunek Młodej Pary', desc: 'Bądź jak paparazzo – uchwyć na zdjęciu moment, gdy nowożeńcy się całują.' },
        { id: 8, title: 'Nocna sceneria', desc: 'Wyjdź na zewnątrz i zrób klimatyczne zdjęcie budynku sali weselnej po zmroku.' },
        { id: 9, title: 'W dobrych rękach', desc: 'Zrób ukradkowe zdjęcie fotografowi lub kamerzyście, gdy są w ferworze pracy.' },
        { id: 10, title: 'Nowa znajomość', desc: 'Przedstaw się komuś, kogo wcześniej nie znałeś, i uwiecznij to spotkanie na selfie.' },
        { id: 11, title: 'Królowie parkietu', desc: 'Sfotografuj osobę lub parę, która Twoim zdaniem najlepiej i najenergiczniej bawi się na parkiecie.' },
        { id: 12, title: 'Pełne szkło, pełny stół', desc: 'Uchwyć moment, w którym wszystkie osoby przy Twoim stole jednocześnie wznoszą toast.' },
        { id: 13, title: 'Weselny klasyk', desc: 'Zrób apetyczne zdjęcie gorącego posiłku (na przykład tradycyjnego rosołu), zanim zaczniesz jeść.' },
        { id: 14, title: 'Mistrz drugiego planu', desc: 'Tradycyjne selfie z kimś bliskim, ale musicie tak pokierować kadrem, aby w tle zepsuł je Wam (wskakując z głupią miną) zupełnie obcy gość.' },
        { id: 15, title: 'Twój kawałek przestrzeni', desc: 'Zrób estetyczne zdjęcie swojej winietki z imieniem lub eleganckiego menu leżącego na stole.' },
        { id: 16, title: 'Zespół w akcji', desc: 'Uchwyć na zdjęciu muzyków lub DJ-a dokładnie w momencie, gdy grają największy hit.' },

    ]
};

// DEV ONLY: Wypełniacz do pełnych 25 zadań w razie braków
while(CONFIG.tasks.length < 16) {
    CONFIG.tasks.push({ id: CONFIG.tasks.length + 1, title: `Zadanie ${CONFIG.tasks.length + 1}`, desc: 'Standardowe zadanie weselne...' });
}

document.addEventListener('DOMContentLoaded', () => {
    
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

    let state = JSON.parse(localStorage.getItem('demoBingoState')) || null;
    let activeIndex = null;

    if (state && state.name) {
        renderApp();
    }

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

        if(els.tasksLeft) els.tasksLeft.innerText = 16 - doneCount;
        requestAnimationFrame(() => checkBingo());
    }

    function openModal(index) {
        activeIndex = index;
        const task = state.board[index];
        
        document.getElementById('modal-title').innerText = task.title;
        document.getElementById('modal-desc').innerText = task.desc;
        
        if (task.done) {
            els.btnComplete.innerText = "COFNIJ ZADANIE (POMYŁKA)";
            els.upload.classList.add('hidden'); 
            els.preview.classList.remove('hidden'); 
            
            if (task.media && task.media.startsWith('data:image')) {
                els.preview.innerHTML = `<img src="${task.media}" style="max-width: 100%; border-radius: var(--radius, 8px); margin-bottom: 20px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);" />`;
            } else if (task.media && task.media.startsWith('idb:')) {
                const videoKey = task.media.replace('idb:', '');
                els.preview.innerHTML = '<p style="margin-bottom:20px; color:#555;"><i>Ładowanie wideo z pamięci telefonu...</i></p>';
                
                getMediaFromDB(videoKey).then(blob => {
                    if (blob) {
                        const vidUrl = URL.createObjectURL(blob);
                        els.preview.innerHTML = `<video src="${vidUrl}" controls playsinline style="max-width: 100%; border-radius: var(--radius, 8px); box-shadow: 0 4px 10px rgba(0,0,0,0.1); margin-bottom: 20px;"></video>`;
                    } else {
                        els.preview.innerHTML = '<p style="margin-bottom:20px; color: #d9534f;"><i>Plik wideo został usunięty przez system operacyjny.</i></p>';
                    }
                });
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

    document.getElementById('btn-close-overlay')?.addEventListener('click', () => {
        document.getElementById('bingo-overlay').classList.add('hidden');
    });

    els.btnComplete.addEventListener('click', async () => {
        const task = state.board[activeIndex];
        
        if (task.done) {
            if (task.media && task.media.startsWith('idb:')) {
                await deleteMediaFromDB(task.media.replace('idb:', ''));
            }
            task.done = false;
            task.media = null; 
        } else {
            if (els.upload.files.length === 0) {
                alert('Zaraz, zaraz! Musisz załączyć zdjęcie jako dowód.');
                return;
            }
            
            let file = els.upload.files[0];
            const isVideo = file.type.startsWith('video/'); 
            
            els.btnComplete.disabled = true;

            let localMediaRef = null;
            if (isVideo) {
                els.btnComplete.innerText = "PRZETWARZANIE WIDEO...";
                const videoKey = `demo_video_${task.id}`;
                await saveMediaToDB(videoKey, file);
                localMediaRef = `idb:${videoKey}`; 
            } else {
                localMediaRef = await generateThumbnail(file);
            }

            if (!isVideo) {
                els.btnComplete.innerText = "SYMULACJA WYSYŁANIA...";
            }
            
            // SYMULACJA DEMO (Bez uderzania na webhooka, ratujemy transfer)
            await new Promise(resolve => setTimeout(resolve, 1500));
            task.done = true;
            task.media = localMediaRef;
            
            els.btnComplete.disabled = false;
        }

        saveState();
        els.modal.close();
        renderApp();
    });

function checkBingo() {
        // ZASADA RECYKLINGU: Gotowy snippet dla siatki 4x4
        const lines = [
            // Poziomo
            [0,1,2,3], [4,5,6,7], [8,9,10,11], [12,13,14,15],
            // Pionowo
            [0,4,8,12], [1,5,9,13], [2,6,10,14], [3,7,11,15],
            // Skosy
            [0,5,10,15], [3,6,9,12]
        ];

        for (let line of lines) {
            if (line.every(index => state.board[index].done)) {
                if (!localStorage.getItem('demoBingoWon')) {
                    setTimeout(() => {
                        document.getElementById('bingo-overlay').classList.remove('hidden');
                    }, 200); 
                    localStorage.setItem('demoBingoWon', 'true');
                }
                return; 
            }
        }
    }

    function saveState() {
        localStorage.setItem('demoBingoState', JSON.stringify(state));
    }

    // --- Narzędzia Bazy Danych ---
    const initDB = () => {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('DemoBingoDB', 1);
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

    // --- UKRYTY "KILL SWITCH" (Reset Aplikacji DEMO) ---
    let clickCount = 0;
    let clickTimer = null;
    const mainLogo = document.querySelector('.main-logo');

    if (mainLogo) {
        mainLogo.addEventListener('click', () => {
            clickCount++;
            if (clickTimer) clearTimeout(clickTimer);
            clickTimer = setTimeout(() => { clickCount = 0; }, 2000);

            if (clickCount >= 5) {
                const confirmReset = confirm("TRYB SERWISOWY: Zresetować pamięć wersji Demo?");
                if (confirmReset) {
                    localStorage.removeItem('demoBingoState');
                    localStorage.removeItem('demoBingoWon');
                    const req = indexedDB.deleteDatabase('DemoBingoDB');
                    req.onsuccess = () => { window.location.reload(); };
                }
                clickCount = 0;
            }
        });
    }
});