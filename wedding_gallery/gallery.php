<?php

/**
 * Moduł: Galeria Foto z Moderacją
 * Opis: Pozwala gościom wgrywać same zdjęcia. Para Młoda decyduje o auto-publikacji.
 * Shortcode formularza: [kawwwa_foto_upload]
 * Shortcode galerii: [kawwwa_foto_galeria]
 */

if (! defined('ABSPATH')) {
    exit;
}

// ==========================================
// 1. REJESTRACJA BAZY DANYCH (CPT: Zdjęcia Gości)
// ==========================================
function kawwwa_register_photo_cpt()
{
    $args = array(
        'labels'             => array('name' => 'Zdjęcia Gości', 'singular_name' => 'Zdjęcie', 'menu_name' => 'Zdjęcia Gości'),
        'public'             => true,
        'publicly_queryable' => false,
        'show_ui'            => true,
        'menu_position'      => 26,
        'menu_icon'          => 'dashicons-camera-alt',
        'supports'           => array('title', 'thumbnail'), // Tylko tytuł i samo zdjęcie
    );
    register_post_type('wesele_foto', $args);
}
add_action('init', 'kawwwa_register_photo_cpt');

// ==========================================
// 2. USTAWIENIA (Przełącznik Moderacji)
// ==========================================
function kawwwa_photo_settings_menu()
{
    add_submenu_page(
        'edit.php?post_type=wesele_foto',
        'Ustawienia Galerii',
        'Ustawienia',
        'manage_options',
        'kawwwa-photo-settings',
        'kawwwa_photo_settings_page'
    );
}
add_action('admin_menu', 'kawwwa_photo_settings_menu');

function kawwwa_photo_register_settings()
{
    register_setting('kawwwa_photo_options', 'kawwwa_gallery_auto_publish');
}
add_action('admin_init', 'kawwwa_photo_register_settings');

function kawwwa_photo_settings_page()
{
    if (! current_user_can('manage_options')) return;
    $auto_publish = get_option('kawwwa_gallery_auto_publish', '0');
?>
    <div class="wrap">
        <h1>📸 Ustawienia Galerii Weselnej</h1>
        <form method="post" action="options.php">
            <?php settings_fields('kawwwa_photo_options'); ?>
            <table class="form-table">
                <tr>
                    <th scope="row">Zarządzanie zdjęciami</th>
                    <td>
                        <select name="kawwwa_gallery_auto_publish">
                            <option value="0" <?php selected($auto_publish, '0'); ?>>Wymaga akceptacji (Oczekujące)</option>
                            <option value="1" <?php selected($auto_publish, '1'); ?>>Auto-publikacja (Od razu na stronie)</option>
                        </select>
                        <p class="description">Jeśli wybierzesz "Wymaga akceptacji", nowe zdjęcia trafią do zakładki "Oczekujące".</p>
                    </td>
                </tr>
            </table>
            <?php submit_button(); ?>
        </form>
    </div>
<?php
}

// ==========================================
// 3. REST API (Backend - Przyjmowanie zdjęć)
// ==========================================
add_action('rest_api_init', function () {
    register_rest_route('kawwwa/v1', '/gallery-upload', array(
        'methods'             => 'POST',
        'callback'            => 'kawwwa_handle_photo_upload',
        'permission_callback' => '__return_true'
    ));
});

function kawwwa_handle_photo_upload(WP_REST_Request $request)
{
    $nonce = $request->get_header('X-WP-Nonce');
    if (! wp_verify_nonce($nonce, 'wp_rest')) {
        return new WP_REST_Response(array('success' => false, 'message' => 'Błąd sesji.'), 403);
    }

    $has_file = isset($_FILES['guest_photo']) && $_FILES['guest_photo']['error'] !== UPLOAD_ERR_NO_FILE;
    if (! $has_file) {
        return new WP_REST_Response(array('success' => false, 'message' => 'Proszę wybrać zdjęcie.'), 400);
    }

    if ($_FILES['guest_photo']['error'] !== UPLOAD_ERR_OK) {
        return new WP_REST_Response(array('success' => false, 'message' => 'Błąd serwera przy wgrywaniu pliku.'), 400);
    }

    // Pobieramy ustawienie Młodych: 0 = pending, 1 = publish
    $auto_publish = get_option('kawwwa_gallery_auto_publish', '0');
    $post_status  = ($auto_publish === '1') ? 'publish' : 'pending';

    // Tworzymy wpis
    $post_id = wp_insert_post(array(
        'post_title'   => 'Zdjęcie od gościa - ' . current_time('Y-m-d H:i'),
        'post_status'  => $post_status,
        'post_type'    => 'wesele_foto'
    ));

    if (is_wp_error($post_id)) {
        return new WP_REST_Response(array('success' => false, 'message' => 'Błąd bazy danych.'), 500);
    }

    require_once(ABSPATH . 'wp-admin/includes/image.php');
    require_once(ABSPATH . 'wp-admin/includes/file.php');
    require_once(ABSPATH . 'wp-admin/includes/media.php');

    $attach_id = media_handle_upload('guest_photo', $post_id);

    if (is_wp_error($attach_id)) {
        wp_delete_post($post_id, true);
        return new WP_REST_Response(array('success' => false, 'message' => 'Błąd formatu pliku.'), 500);
    }

    $mime_type = get_post_mime_type($attach_id);

    // TWARDA WALIDACJA (TYLKO ZDJĘCIA)
    if (strpos($mime_type, 'image') !== false) {
        set_post_thumbnail($post_id, $attach_id);
        $msg = ($post_status === 'pending') ? 'Zdjęcie przesłane! Czeka na akceptację Pary Młodej.' : 'Zdjęcie zostało dodane do galerii!';
        return new WP_REST_Response(array('success' => true, 'message' => $msg), 200);
    } else {
        // Ktoś próbował wgrać wideo lub inny plik - usuwamy
        wp_delete_attachment($attach_id, true);
        wp_delete_post($post_id, true);
        return new WP_REST_Response(array('success' => false, 'message' => 'Dozwolone są tylko zdjęcia (JPG, PNG)!'), 400);
    }
}

// ==========================================
// 4. SHORTCODE FRONTEND (Formularz Wgrywania)
// ==========================================
function kawwwa_photo_upload_shortcode()
{
    $nonce = wp_create_nonce('wp_rest');
    $api_url = esc_url_raw(rest_url('kawwwa/v1/gallery-upload'));

    ob_start();
?>
    <style>
        .ko-photo-form {
            max-width: 500px;
            margin: 0 auto;
            background: #fff;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
            text-align: center;
        }

        .ko-photo-form .file-upload-label {
            display: block;
            padding: 20px;
            border: 2px dashed #B69772;
            cursor: pointer;
            color: #5C1D24;
            font-weight: 600;
            margin-bottom: 20px;
            border-radius: 6px;
            transition: 0.3s;
        }

        .ko-photo-form .file-upload-label:hover {
            background: rgba(182, 151, 114, 0.1);
        }

        .ko-photo-form input[type="file"] {
            display: none;
        }

        .ko-photo-form button {
            background: #5C1D24;
            color: #fff;
            border: none;
            padding: 15px 30px;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
            width: 100%;
            transition: 0.3s;
        }

        .ko-photo-form button:hover {
            background: #7A2A33;
        }

        #ko-photo-response {
            margin-top: 15px;
            font-weight: bold;
        }
    </style>

    <div class="ko-photo-form">
        <form id="kawwwa-photo-form">
            <label class="file-upload-label" id="photoLabel">
                📸 Wybierz zdjęcie z telefonu...
                <input type="file" name="guest_photo" id="guest_photo" accept="image/jpeg, image/png, image/webp" required>
            </label>
            <button type="submit" id="photo-submit-btn">Dodaj do galerii</button>
            <div id="ko-photo-response"></div>
        </form>
    </div>

    <script>
        document.getElementById('guest_photo').addEventListener('change', function(e) {
            let label = document.getElementById('photoLabel');
            if (e.target.files.length > 0) {
                label.innerHTML = "✓ Wybrano zdjęcie: " + e.target.files[0].name.substring(0, 20) + "...";
                label.style.borderColor = "green";
            }
        });

        document.getElementById('kawwwa-photo-form').addEventListener('submit', async function(e) {
            e.preventDefault();
            const btn = document.getElementById('photo-submit-btn');
            const res = document.getElementById('ko-photo-response');
            const formData = new FormData(this);

            btn.disabled = true;
            btn.innerText = "Wysyłanie...";
            res.innerHTML = "";

            try {
                const response = await fetch("<?php echo $api_url; ?>", {
                    method: 'POST',
                    headers: {
                        'X-WP-Nonce': "<?php echo $nonce; ?>"
                    },
                    body: formData
                });
                const result = await response.json();

                res.style.color = result.success ? "green" : "red";
                res.innerHTML = result.message;
                if (result.success) {
                    this.reset();
                    document.getElementById('photoLabel').innerHTML = "📸 Wybierz kolejne zdjęcie...";
                }
            } catch (error) {
                res.style.color = "red";
                res.innerHTML = "Błąd połączenia z serwerem.";
            } finally {
                btn.disabled = false;
                btn.innerText = "Dodaj do galerii";
            }
        });
    </script>
<?php
    return ob_get_clean();
}
add_shortcode('kawwwa_foto_upload', 'kawwwa_photo_upload_shortcode');

// ==========================================
// 5. SHORTCODE FRONTEND (Wyświetlanie Galerii)
// ==========================================
function kawwwa_photo_gallery_shortcode()
{
    // Pobieramy TYLKO opublikowane zdjęcia (Zasada Moderacji)
    $query = new WP_Query(array(
        'post_type'      => 'wesele_foto',
        'post_status'    => 'publish', // Odfiltrowuje te "Oczekujące"
        'posts_per_page' => 100,
    ));

    ob_start();
    if ($query->have_posts()) {
        echo '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px;">';
        while ($query->have_posts()) {
            $query->the_post();
            if (has_post_thumbnail()) {
                echo '<div>';
                the_post_thumbnail('medium', array('style' => 'width: 100%; height: 200px; object-fit: cover; border-radius: 8px;'));
                echo '</div>';
            }
        }
        echo '</div>';
        wp_reset_postdata();
    } else {
        echo '<p style="text-align:center;">Galeria jest pusta. Dodaj pierwsze zdjęcie!</p>';
    }
    return ob_get_clean();
}
add_shortcode('kawwwa_foto_galeria', 'kawwwa_photo_gallery_shortcode');
