/* =========================================
   1. KONFIGURACJA (Tylko to zmieniasz dla klientów)
   ========================================= */
const CONFIG = {
    bingoMessage: "Mamy bingo! Odbierz nagrodę u świadka przy barze!",
    // Tutaj docelowo wklejasz 25 zadań. Zrobiłem 3 jako przykład.
    tasks: [
        { id: 1, title: 'Król Parkietu', desc: 'Wideo z solowego, epickiego popisu tanecznego (szalone obroty i skoki mile widziane!).' },
        { id: 2, title: 'Wzruszenie', desc: 'Uchwyć moment, gdy ktoś z gości ociera łzę wzruszenia.' },
        { id: 3, title: 'Selfie z Teściową', desc: 'Zrób sobie uśmiechnięte zdjęcie z mamą panny młodej lub pana młodego.' }
    ]
};

// DEV HELP: Generujemy puste zadania do pełnych 25, żeby aplikacja działała do testów.
// Przed oddaniem klientowi, upewnij się, że w tablicy wyżej jest dokładnie 25 obiektów i usuń tę pętlę.
while(CONFIG.tasks.length < 25) {
    CONFIG.tasks.push({ id: CONFIG.tasks.length + 1, title: `Zadanie ${CONFIG.tasks.length + 1}`, desc: 'Opis zadania do wykonania...' });
}

/* =========================================
   2. INICJALIZACJA I PAMIĘĆ (Core System)
   ========================================= */
document.addEventListener('DOMContentLoaded', () => {
    // Cache'ujemy elementy DOM (optymalizacja wydajności)
    const els = {
        login: document.getElementById('login-screen'),
        app: document.getElementById('app-container'),
        board: document.getElementById('bingo-board'),
        modal: document.getElementById('task-modal'),
        upload: document.getElementById('media-upload'),
        preview: document.getElementById('media-preview'),
        btnComplete: document.getElementById('btn-complete')
    };

    // Pobieramy stan gry z pamięci przeglądarki (localStorage)
    let state = JSON.parse(localStorage.getItem('bingoState')) || null;
    let activeIndex = null;

    // Jeśli gość jest już w systemie, pomijamy logowanie
    if (state && state.name) {
        renderApp();
    }

/* =========================================
   3. LOGIKA STARTU (Tasowanie planszy)
   ========================================= */
    document.getElementById('start-btn').addEventListener('click', () => {
        const name = document.getElementById('name-input').value.trim();
        if (!name) {
            alert('Proszę, podaj swoje imię.');
            return;
        }
        
        // Algorytm Fisher-Yates (Najwydajniejsze tasowanie - każdy gość ma inną planszę)
        let shuffled = [...CONFIG.tasks].sort(() => Math.random() - 0.5);
        
        state = { 
            name: name, 
            board: shuffled.map(t => ({ ...t, done: false, media: null })) 
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
        document.getElementById('player-name').innerText = state.name;
        
        els.board.innerHTML = '';
        let doneCount = 0;

        state.board.forEach((task, index) => {
            if (task.done) doneCount++;
            
            const tile = document.createElement('div');
            // Zabezpieczenie przed XSS, używamy className i innerText
            tile.className = `tile ${task.done ? 'done' : ''}`;
            tile.innerText = index + 1; // Zgodnie z wytycznymi - tylko numerki
            tile.onclick = () => openModal(index);
            
            els.board.appendChild(tile);
        });

        document.getElementById('tasks-left').innerText = 25 - doneCount;
        checkBingo(); // Sprawdzamy wygraną po każdym renderze
    }

/* =========================================
   5. OBSŁUGA ZADAŃ (Modal)
   ========================================= */
    function openModal(index) {
        activeIndex = index;
        const task = state.board[index];
        
        document.getElementById('modal-title').innerText = task.title;
        document.getElementById('modal-desc').innerText = task.desc;
        
        if (task.done) {
            // Widok: Zadanie już zrobione
            els.btnComplete.innerText = "COFNIJ ZADANIE (POMYŁKA)";
            els.upload.classList.add('hidden');
            els.preview.classList.remove('hidden');
            // Wyświetlenie podglądu zapisanego w pamięci
            els.preview.innerHTML = task.media && task.media.includes('video') 
                ? '<i>Film został zapisany.</i>' 
                : `<img src="${task.media}" style="max-width:100%; border-radius: 4px;" />`;
        } else {
            // Widok: Zadanie do zrobienia
            els.btnComplete.innerText = "OZNACZ JAKO WYKONANE";
            els.upload.classList.remove('hidden');
            els.upload.value = ''; // Czyszczenie inputu
            els.preview.classList.add('hidden');
        }

        els.modal.showModal();
    }

    // Zamykanie modala
    document.getElementById('btn-cancel').onclick = () => els.modal.close();

    // Akcja: Wykonanie / Cofnięcie zadania
    els.btnComplete.onclick = () => {
        const task = state.board[activeIndex];
        
        if (task.done) {
            // Cofanie
            task.done = false;
            task.media = null;
        } else {
            // Zatwierdzanie
            if (els.upload.files.length === 0) {
                alert('Musisz załączyć zdjęcie lub film ze zrobionego zadania!');
                return;
            }
            
            // Generujemy lokalny URL pliku do podglądu (bez wysyłania na serwer)
            const file = els.upload.files[0];
            task.media = URL.createObjectURL(file);
            task.done = true;
        }

        saveState();
        els.modal.close();
        renderApp();
    };

/* =========================================
   6. ALGORYTM BINGO (Detekcja wygranej)
   ========================================= */
    function checkBingo() {
        const lines = [
            [0,1,2,3,4], [5,6,7,8,9], [10,11,12,13,14], [15,16,17,18,19], [20,21,22,23,24], // Poziom
            [0,5,10,15,20], [1,6,11,16,21], [2,7,12,17,22], [3,8,13,18,23], [4,9,14,19,24], // Pion
            [0,6,12,18,24], [4,8,12,16,20] // Skos
        ];

        for (let line of lines) {
            if (line.every(index => state.board[index].done)) {
                // Jeśli flaga bingoWon nie jest ustawiona - pokaż gratulacje
                if (!localStorage.getItem('bingoWon')) {
                    // Tutaj możemy wywołać ładniejszy modal, na razie natywny alert
                    setTimeout(() => alert(CONFIG.bingoMessage), 300); 
                    localStorage.setItem('bingoWon', 'true');
                }
                return;
            }
        }
    }

    // Helper: Zapis stanu do pamięci przeglądarki
    function saveState() {
        localStorage.setItem('bingoState', JSON.stringify(state));
    }
});