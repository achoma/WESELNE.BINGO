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
    webhookUrl: "https://hook.eu1.make.com/TWOJ_ID_WEBHOOKA", 
    
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
    els.btnComplete.addEventListener('click', async () => {
        const task = state.board[activeIndex];
        
        if (task.done) {
            // Logika wycofania zadania (zmiana zdania)
            task.done = false;
        } else {
            // Logika uploadu
            if (els.upload.files.length === 0) {
                alert('Zaraz, zaraz! Musisz załączyć zdjęcie lub wideo jako dowód.');
                return;
            }
            
            const file = els.upload.files[0];
            const originalBtnText = els.btnComplete.innerText;
            
            // UX: Blokada podwójnego kliknięcia i loader
            els.btnComplete.innerText = "WYSYŁANIE... PROSZĘ CZEKAĆ";
            els.btnComplete.disabled = true;

            try {
                // Budujemy paczkę danych dla Webhooka
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

            // Sukces - odblokowujemy przycisk
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
});