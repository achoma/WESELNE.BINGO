/**
 * Moduł: Kawwwa Cyfrowa Księga Gości - Frontend JS
 * Opis: Obsługa formularza, asynchroniczna wysyłka (Fetch API), walidacja.
 */

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('kawwwa-guestbook-form');
    // Jeśli nie ma formularza na stronie, przerywamy skrypt (Wydajność)
    if (!form) return;

    const responseDiv = document.getElementById('kawwwa-form-response');
    const submitBtn = document.getElementById('gb-submit-btn');

    form.addEventListener('submit', async (e) => {
        // Blokujemy standardowe przeładowanie strony
        e.preventDefault();

        // Zabezpieczenie przed wielokrotnym kliknięciem (Stability)
        submitBtn.disabled = true;
        submitBtn.innerText = 'Przetwarzanie...';
        responseDiv.innerHTML = '';
        responseDiv.style.color = 'inherit';

        // Pakujemy dane z formularza
        const formData = new FormData(form);

        try {
            // Wysłanie danych do naszego Endpointu REST API (obiekt kawwwaGB zdefiniowaliśmy w PHP)
            const response = await fetch(kawwwaGB.apiUrl, {
                method: 'POST',
                headers: {
                    // Krytyczne: przekazujemy klucz Nonce dla weryfikacji tożsamości
                    'X-WP-Nonce': kawwwaGB.nonce
                },
                body: formData
            });

            // Odbieramy odpowiedź z serwera
            const result = await response.json();

            // Sprawdzamy status HTTP i naszą flagę 'success'
            if (response.ok && result.success) {
                form.reset(); // Czyścimy formularz po sukcesie
                responseDiv.style.color = 'green';
                responseDiv.innerHTML = result.message;
            } else {
                responseDiv.style.color = 'red';
                // Wyświetlamy błąd z backendu lub generyczny
                responseDiv.innerHTML = result.message || 'Wystąpił błąd podczas wysyłania.';
            }

        } catch (error) {
            // Błąd krytyczny (np. padła sieć, serwer nie odpowiada)
            console.error('Błąd API Księgi Gości:', error);
            responseDiv.style.color = 'red';
            responseDiv.innerHTML = 'Błąd krytyczny połączenia z serwerem. Spróbuj ponownie.';
        } finally {
            // Przywracamy przycisk do stanu początkowego, niezależnie od wyniku
            submitBtn.disabled = false;
            submitBtn.innerText = 'Zostaw Życzenia';
        }
    });
});