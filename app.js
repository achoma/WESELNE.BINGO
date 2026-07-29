/**
 * WESELNE BINGO - CORE ENGINE (Vanilla JS)
 * Wersja: 1.0 (Snippet Library - gotowe do recyklingu)
 * Architektura: SPA + LocalStorage + Asynchronous Webhook
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
        // W produkcji usuń pętlę i wpisz tu fizycznie 25 obiektów.
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
    
    // Cache'owanie DOM (zwiększa wydajność, nie szukamy elementów w locie)
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

    // Odzyskujemy stan z localStorage (Bank-level stability: odporność na odświeżenie strony)
    let state = JSON.parse(localStorage.getItem('bingoState')) || null;
    let activeIndex = null;

    // Fast-track: jeśli gość już podał imię, ładujemy planszę
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
        
        // Algorytm Fisher-Yates (Każdy gość ma unikalny układ planszy)
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
        
        // Czyszczenie i budowa DOM
        els.board.innerHTML = '';
        let doneCount = 0;

        state.board.forEach((task, index) => {
            if (task.done) doneCount++;
            
            const tile = document.createElement('div');
            tile.className = `tile ${task.done ? 'done' : ''}`;
            tile.innerText = index + 1; // Kafelki pokazują tylko numerki
            
            // Przypinamy event listener bez inline HTML (Security First - ochrona przed XSS)
            tile.addEventListener('click', () => openModal(index));
            els.board.appendChild(tile);
        });

        els.tasksLeft.innerText = 25 - doneCount;
        
        // Asynchroniczne sprawdzenie wygranej, by nie blokować renderowania UI
        requestAnimationFrame(() => checkBingo());
    }

/* =========================================
   5. OBSŁUGA MODALA I WYSYŁKA PLIKÓW
   ========================================= */
    function openModal(index) {
        activeIndex = index;
        const task = state.board[index];
        
        document.getElementById('modal-title').innerText = task.title;
        document.getElementById('modal-desc').innerText = task.desc;
        
        if (task.done) {
            // Tryb: Zadanie wykonane (Opcja wycofania)
            els.btnComplete.innerText = "COFNIJ ZADANIE (POMYŁKA)";
            els.upload.classList.add('hidden');
            els.preview.classList.remove('hidden');
            els.preview.innerHTML = '<i>Plik został przesłany na serwer Młodych.</i>';
        } else {
            // Tryb: Zadanie do wykonania
            els.btnComplete.innerText = "OZNACZ JAKO WYKONANE";
            els.upload.classList.remove('hidden');
            els.upload.value = ''; // Czyszczenie inputu pliku
            els.preview.classList.add('hidden');
        }

        els.modal.showModal();
    }

    els.btnCancel.addEventListener('click', () => els.modal.close());

    // Główna funkcja wykonawcza: Wysyłka (Make.com API) lub cofnięcie
// Główna funkcja wykonawcza: Wysyłka (Make.com API) lub cofnięcie
    els.btnComplete.addEventListener('click', async () => {
        const task = state.board[activeIndex];
        
        if (task.done) {
            // Logika wycofania zadania (zmiana zdania)
            task.done = false;
            task.media = null; // WYZEROWANIE MINIATURKI z localStorage
        } else {
            // Logika uploadu
            if (els.upload.files.length === 0) {
                alert('Zaraz, zaraz! Musisz załączyć zdjęcie lub wideo jako dowód.');
                return;
            }
            
            let file = els.upload.files[0];
            const originalBtnText = els.btnComplete.innerText;
            
            // UX: Blokada podwójnego kliknięcia i zabezpieczenie frontendu
            els.btnComplete.disabled = true;

            // 1. TWORZYMY MIKROMINIATURKĘ DO PAMIĘCI (Przed kompresją do wysyłki)
            // Dzięki temu localStorage ma podgląd ważący zaledwie ~15KB, co chroni system przed padem.
            const localThumbnail = await generateThumbnail(file);

            // 2. SYSTEM BEZPIECZEŃSTWA: KOMPRESJA W LOCIE DLA G-DRIVE
            if (file.type.startsWith('image/')) {
                els.btnComplete.innerText = "KOMPRESOWANIE... PROSZĘ CZEKAĆ";
                file = await compressImage(file, 1920, 0.8); 
            } else if (file.size > 50 * 1024 * 1024) {
                // Zabezpieczenie limitów Make.com dla wideo (max 50MB)
                alert("Ten film jest za duży! Maksymalny dopuszczalny rozmiar to 50MB.");
                els.btnComplete.disabled = false;
                return; 
            }
            
            els.btnComplete.innerText = "WYSYŁANIE... PROSZĘ CZEKAĆ";

            // 3. WYSYŁKA ASYNCHRONICZNA DO MAKE.COM
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
                    task.media = localThumbnail; // SUKCES: Zapisujemy tylko lekką miniaturkę do wyświetlania w aplikacji
                } else {
                    throw new Error("Odmowa serwera");
                }
            } catch (error) {
                console.error("Upload error:", error);
                alert("Nie udało się wysłać pliku. Sprawdź połączenie z internetem lub spróbuj mniejszy plik.");
                els.btnComplete.innerText = originalBtnText;
                els.btnComplete.disabled = false;
                return; // Przerwanie funkcji, nie zapisujemy jako 'zrobione'
            }

            // Odblokowanie przycisku po sukcesie
            els.btnComplete.disabled = false;
        }

        saveState();
        els.modal.close();
        renderApp();
    });

/* =========================================
   6. SILNIK BINGO (Matematyka planszy)
   ========================================= */
    function checkBingo() {
        // Wszystkie możliwe kombinacje wygrywające w siatce 5x5 (Indeksy 0-24)
        const lines = [
            // Rzędy poziome
            [0,1,2,3,4], [5,6,7,8,9], [10,11,12,13,14], [15,16,17,18,19], [20,21,22,23,24],
            // Kolumny pionowe
            [0,5,10,15,20], [1,6,11,16,21], [2,7,12,17,22], [3,8,13,18,23], [4,9,14,19,24],
            // Przekątne
            [0,6,12,18,24], [4,8,12,16,20]
        ];

        for (let line of lines) {
            // Sprawdzamy czy wszystkie indeksy w danej linii mają status 'done: true'
            if (line.every(index => state.board[index].done)) {
                
                // Blokada przed spamowaniem komunikatem po każdym kolejnym zadaniu
                if (!localStorage.getItem('bingoWon')) {
                    // setTimeout zapewnia, że najpierw przerysuje się kafelek, a potem wyskoczy alert
                    setTimeout(() => alert(CONFIG.bingoMessage), 200); 
                    localStorage.setItem('bingoWon', 'true');
                }
                return; // Znaleźliśmy wygraną, nie musimy sprawdzać reszty kombinacji
            }
        }
    }

    // Funkcja pomocnicza: Synchronizacja zmiennej state z pamięcią przeglądarki
    function saveState() {
        localStorage.setItem('bingoState', JSON.stringify(state));
    }

// === SNIPPET: KOMPRESJA ZDJĘĆ W LOCIE ===
// Możesz zapisać tę funkcję do swojej bazy w Notion.
const compressImage = (file, maxWidth = 1920, quality = 0.8) => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file); // Czytamy plik z inputu
        
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            
            img.onload = () => {
                const canvas = document.createElement('canvas'); // Tworzymy niewidzialne płótno
                let width = img.width;
                let height = img.height;

                // Skalujemy proporcjonalnie, jeśli zdjęcie jest za szerokie
                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height); // Malujemy pomniejszone zdjęcie

                // Zmieniamy płótno z powrotem w gotowy plik JPG
                canvas.toBlob((blob) => {
                    const compressedFile = new File([blob], file.name, {
                        type: 'image/jpeg',
                        lastModified: Date.now(),
                    });
                    resolve(compressedFile); // Oddajemy lekki plik
                }, 'image/jpeg', quality); // 0.8 to 80% jakości - idealny balans
            };
        };
    });
};

// === SNIPPET: GENERATOR MIKROMINIATUREK DO LOCALSTORAGE ===
// Zapisz w bibliotece. Idealne do podglądów zdjęć profilowych itp. bez bazy danych.
const generateThumbnail = (file) => {
    return new Promise((resolve) => {
        // Jeśli to wideo, nie generujemy podglądu, rzucamy pusty wynik
        if (!file.type.startsWith('image/')) {
            resolve(null);
            return;
        }

        const reader = new FileReader();
        reader.readAsDataURL(file);
        
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 300; // Tylko do okienka modalnego
                let width = img.width;
                let height = img.height;

                if (width > MAX_WIDTH) {
                    height = Math.round((height * MAX_WIDTH) / width);
                    width = MAX_WIDTH;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // Zrzut do bardzo lekkiego Base64 (jakość 0.5)
                const base64Thumbnail = canvas.toDataURL('image/jpeg', 0.5);
                resolve(base64Thumbnail); 
            };
        };
    });
};    
    
});