/**
 * WESELNE BINGO - CORE ENGINE (Vanilla JS) - WERSJA DEMO
 * Cel: Izolowany system testowy (symulacja bazy, zero zapytań API).
 */

const CONFIG = {
    // Brak webhooka Make.com - to jest odizolowane demo.
    bingoMessage: "Mamy bingo! Odbierz nagrodę u świadka przy barze!",
    
    tasks: [
        { id: 1, title: 'Dworska dyplomacja', desc: 'Nagranie, na którym namawiasz innego gościa (z przeciwnej rodziny!), aby wspólnie z Tobą spróbował pogadać z zamkowymi papugami.' },
        { id: 2, title: 'Królewska sjesta', desc: 'Zdjęcie kogoś, kto ukradkiem "złapał zawieszkę" lub ucina sobie drzemkę na siedząco.' },
        { id: 3, title: 'Słodki rabuś', desc: 'Zdjęcie osoby, która nałożyła sobie na talerzyk tyle ciast ze słodkiego stołu, że ledwo mieści je w dłoniach.' },
        { id: 4, title: 'Król Parkietu', desc: 'Wideo z solowego, epickiego popisu tanecznego (szalone obroty i skoki mile widziane!).' },
        { id: 5, title: 'Grupowe błogosławieństwo', desc: 'Selfie z portretem Ignacego Krasickiego w sali balowej, ale na zdjęciu musisz być Ty oraz przynajmniej dwie osoby, których nie znałeś/aś przed weselem!' },
        { id: 6, title: 'Taneczny pociąg', desc: 'Filmik z parkietu, na którym prowadzisz lub dołączasz do wężyka/pociągu tanecznego i trzymasz za ramiona kogoś, kogo dopiero co poznałeś/aś.' },
        { id: 7, title: 'Klub płaskiego obuwia', desc: 'Zdjęcie, na którym pozujesz z inną osobą, która (tak jak Ty lub zamiast Ciebie) zmieniła już buty na wygodne trampki.' },
        { id: 8, title: 'Krasicki by tego nie wymyślił', desc: 'Filmik, na którym inny gość opowiada Ci najgorszy lub najśmieszniejszy weselny suchar, jaki zna (im czarniejszy humor tym lepiej!).' },
        { id: 9, title: 'Synchroniczne szaleństwo', desc: 'Wideo, na którym tańczysz ramię w ramię z kimś nowym ten sam układ (np. Macarenę, Belgijkę czy lub inne).' },
        { id: 10, title: 'Dworskie pogaduchy', desc: 'Fotka z kimś, kogo poznałeś/aś dopiero przed chwilą, podczas wspólnego łapania oddechu na tej samej ławce w parku.' },
        { id: 11, title: 'Agenci w garniturach', desc: 'Selfie z osobą, z którą wspólnie założyliście okulary przeciwsłoneczne na parkiecie po północy (im ciemniej w sali, tym lepiej!).' },
        { id: 12, title: 'Złoty środek', desc: 'Zdjęcie, na którym "witasz się" (np. epicki żółwik lub skomplikowany uścisk dłoni) z osobą, która ma na sobie ubranie w tym samym kolorze co Ty.' },
        { id: 13, title: 'Słodki pakt', desc: 'Krótkie wideo, na którym wspólnie z kimś nowym „testujecie” ten sam deser ze słodkiego stołu i jednocześnie oceniacie go kciukiem w górę.' },
        { id: 14, title: 'Mistrz drugiego planu', desc: 'Tradycyjne selfie z kimś bliskim, ale musicie tak pokierować kadrem, aby w tle zepsuł je Wam (wskakując z głupią miną) zupełnie obcy gość.' },
        { id: 15, title: 'Zaklinacze alpak', desc: 'Filmik, na którym wraz z nowo poznanym gościem próbujecie zsynchronizować Wasze ruchy głowy z ruchami żującej alpaki w zagrodzie.' },
        { id: 16, title: 'Strażnicy Zamkowych Wrót', desc: 'Zdjęcie z gościem, z którym zrobiliście groźne miny niczym średniowieczni strażnicy, stojąc po dwóch stronach wejścia do zamku (tuż obok papug!).' },
        { id: 17, title: 'Sojusz mięsny (lub wege)', desc: 'Fotka z osobą, z którą spotkałeś/aś się przy wiejskim stole podczas nakładania tej samej potrawy (np. ogórka kiszonego lub smalcu). Przybicie widelców mile widziane!' },
        { id: 18, title: 'Barmański test smaku', desc: 'Zdjęcie z gościem, który polecił Ci swój ulubiony drink z baru. Na zdjęciu oboje trzymacie szklanki i robicie minę kiwających z uznaniem głową ekspertów.' },
        { id: 19, title: 'Kofeinowe ploteczki', desc: 'Fotka z kimś, kogo zagadnąłeś/aś w kolejce do ekspresu po weselną kawę, trzymając filiżanki w geście toastu.' },
        { id: 20, title: 'Weselny wywiad', desc: 'Zdjęcie z gościem ze stołu o numerze o 4 wyższym lub niższym od Twojego, od którego dowiedziałeś/aś się, skąd dokładnie zna Parę Młodą.' },
        { id: 21, title: 'Wysoka piątka', desc: 'Zdjęcie w locie, na którym przybijasz spektakularną „piątkę” z kimś, mijając się w szybkim tańcu grupowym.' },
        { id: 22, title: 'Grupowe rozpięcie', desc: 'Selfie z co najmniej trzema innymi dżentelmenami, którzy solidarnie podwinęli rękawy w koszulach do tej samej wysokości.' },
        { id: 23, title: 'Matematyka weselna', desc: 'Odwiedź stolik, którego numer po zsumowaniu z Twoim daje liczbę 10 (np. jeśli siedzisz przy Stole 3, Twoim celem jest Stół 7). Zrób sobie grupowe selfie z całą tamtejszą ekipą w geście "zjednoczenia stołów"!' },
        { id: 24, title: 'Wizytacja u sąsiada', desc: 'Podejdź do stolika o numerze o jeden wyższym lub niższym niż Twój, znajdź tam osobę o tym samym kolorze oczu co Ty i nagraj wideo, na którym wznosicie wspólny okrzyk: „Za Parę Młodą!”.' },
        { id: 25, title: 'Poetycka misja u Krasickiego', desc: 'Zbierz po jednej osobie z trzech różnych stołów (muszą pokazać na palcach numery swoich stolików) i zróbcie wspólne, epickie zdjęcie pod portretem Ignacego Krasickiego jako „Sojusz Czterech Stołów”.' }
    ]
};

// DEV ONLY: Wypełniacz do pełnych 25 zadań w razie braków
while(CONFIG.tasks.length < 25) {
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

        if(els.tasksLeft) els.tasksLeft.innerText = 25 - doneCount;
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
                alert('Zaraz, zaraz! Musisz załączyć zdjęcie lub wideo jako dowód.');
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
        const lines = [
            [0,1,2,3,4], [5,6,7,8,9], [10,11,12,13,14], [15,16,17,18,19], [20,21,22,23,24],
            [0,5,10,15,20], [1,6,11,16,21], [2,7,12,17,22], [3,8,13,18,23], [4,9,14,19,24],
            [0,6,12,18,24], [4,8,12,16,20]
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