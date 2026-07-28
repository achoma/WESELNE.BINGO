document.addEventListener("DOMContentLoaded", function () {
    
    const observerOptions = { root: null, rootMargin: '0px', threshold: 0.1 };
    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.observe-me').forEach(item => {
        observer.observe(item);
    });

    const form = document.getElementById('kawwwa-guestbook-form');
    if (!form) return;

    const fileInput = document.getElementById('file');
    const fileLabelText = document.querySelector('#fileLabel span');
    const responseDiv = document.getElementById('kawwwa-form-response');
    const submitBtn = document.getElementById('gb-submit-btn');

    fileInput.addEventListener('change', function (e) {
        if (e.target.files && e.target.files.length > 0) {
            let fileName = e.target.files[0].name;
            if(fileName.length > 20) fileName = fileName.substring(0, 17) + '...';
            
            fileLabelText.textContent = "✓ Gotowe (" + fileName + ")";
            document.getElementById('fileLabel').style.borderColor = "var(--gold-accent)";
            document.getElementById('fileLabel').style.color = "var(--gold-accent)";
        } else {
            fileLabelText.textContent = kawwwaGB.plMedia;
            document.getElementById('fileLabel').style.borderColor = "var(--text-burgundy)";
            document.getElementById('fileLabel').style.color = "var(--text-burgundy)";
        }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (fileInput.files.length > 0 && fileInput.files[0].size > 30 * 1024 * 1024) {
            responseDiv.style.color = 'red';
            responseDiv.innerHTML = 'Plik jest za duży (max 30MB).';
            return;
        }

        const originalBtnText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = "Przetwarzanie...";
        submitBtn.style.backgroundColor = "var(--gold-accent)";
        submitBtn.style.borderColor = "var(--gold-accent)";
        responseDiv.innerHTML = '';

        const formData = new FormData(form);

        try {
            const response = await fetch(kawwwaGB.apiUrl, {
                method: 'POST',
                headers: { 'X-WP-Nonce': kawwwaGB.nonce },
                body: formData
            });

            const result = await response.json();

            if (response.ok && result.success) {
                form.reset();
                
                fileLabelText.textContent = kawwwaGB.plMedia;
                document.getElementById('fileLabel').style.borderColor = "var(--text-burgundy)";
                document.getElementById('fileLabel').style.color = "var(--text-burgundy)";
                
                responseDiv.style.color = 'green';
                responseDiv.innerHTML = result.message;
                submitBtn.textContent = "Wysłano pomyślnie!";
            } else {
                responseDiv.style.color = 'red';
                responseDiv.innerHTML = result.message || 'Wystąpił błąd.';
            }
        } catch (error) {
            responseDiv.style.color = 'red';
            responseDiv.innerHTML = 'Błąd krytyczny połączenia z serwerem.';
        } finally {
            setTimeout(() => {
                submitBtn.disabled = false;
                submitBtn.textContent = originalBtnText;
                submitBtn.style.backgroundColor = "var(--btn-color)";
                submitBtn.style.borderColor = "var(--btn-color)";
                if (responseDiv.style.color === 'green') {
                    responseDiv.innerHTML = '';
                }
            }, 3000);
        }
    });
});