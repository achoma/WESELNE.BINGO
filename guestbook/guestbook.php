<?php

/**
 * Plugin Name: Cyfrowa Księga Gości (Premium)
 * Description: W pełni zarządzalny moduł Księgi Gości (UI Premium, Webhook Wideo, Custom Placeholdery, Mobile UX, Meta Box Wideo).
 * Version: 3.3.0
 * Author: kawwwa.online
 */

if (! defined('ABSPATH')) {
    exit;
}

// ==========================================
// 1. REJESTRACJA BAZY DANYCH (CPT)
// ==========================================
function kawwwa_register_guestbook_cpt()
{
    $args = array(
        'labels'             => array('name' => 'Księga Gości', 'singular_name' => 'Wpis', 'menu_name' => 'Księga Gości'),
        'public'             => true,
        'publicly_queryable' => false,
        'show_ui'            => true,
        'show_in_menu'       => true,
        'menu_position'      => 25,
        'menu_icon'          => 'dashicons-book-alt',
        'supports'           => array('title', 'editor', 'thumbnail'), // Thumbnail obsługuje tylko zdjęcia
    );
    register_post_type('ksiega_gosci', $args);
}
add_action('init', 'kawwwa_register_guestbook_cpt');

// ==========================================
// 1B. META BOX WIDEO (WIDOK W PANELU ADMINA - PREMIUM UX)
// ==========================================
function kawwwa_add_video_meta_box()
{
    add_meta_box('kawwwa_video_meta', '🎥 Załączone Wideo (Pamiątka)', 'kawwwa_video_meta_callback', 'ksiega_gosci', 'normal', 'high');
}
add_action('add_meta_boxes', 'kawwwa_add_video_meta_box');

function kawwwa_video_meta_callback($post)
{
    $video_id = get_post_meta($post->ID, '_guest_video_id', true);
    if ($video_id) {
        $video_url = wp_get_attachment_url($video_id);
        echo '<div style="background:#000; padding:10px; border-radius:8px; text-align:center;">';
        echo '<video controls src="' . esc_url($video_url) . '" style="max-width:100%; max-height:400px; outline:none;"></video>';
        echo '</div>';
    } else {
        echo '<p style="color:#666; font-style:italic;">Do tego wpisu nie dodano wideo.</p>';
    }
}

// ==========================================
// 2. PANEL USTAWIEŃ WTYCZKI
// ==========================================
function kawwwa_gb_register_settings()
{
    register_setting('kawwwa_gb_options_group', 'kawwwa_gb_settings');
}
add_action('admin_init', 'kawwwa_gb_register_settings');

function kawwwa_gb_settings_menu()
{
    add_submenu_page(
        'edit.php?post_type=ksiega_gosci',
        'Ustawienia Księgi',
        'Ustawienia',
        'manage_options',
        'kawwwa-guestbook-settings',
        'kawwwa_gb_settings_page_html'
    );
}
add_action('admin_menu', 'kawwwa_gb_settings_menu');

function kawwwa_gb_settings_page_html()
{
    if (! current_user_can('manage_options')) {
        return;
    }

    $options = get_option('kawwwa_gb_settings', array());

    $bg_body       = $options['bg_body'] ?? '#F4EFE8';
    $bg_card       = $options['bg_card'] ?? '#FCFBF9';
    $primary_color = $options['primary_color'] ?? '#5C1D24';
    $accent_color  = $options['accent_color'] ?? '#B69772';
    $btn_color     = $options['btn_color'] ?? '#5C1D24';
    $btn_hover     = $options['btn_hover'] ?? '#7A2A33';
    $msg_height    = $options['msg_height'] ?? '150';
    $pl_name       = $options['pl_name'] ?? 'Wasze imiona (np. Ciocia Kasia i Wujek Tomek)';
    $pl_msg        = $options['pl_msg'] ?? 'Napiszcie kilka słów od serca...';
    $pl_media      = $options['pl_media'] ?? 'Dodaj pamiątkę (Zdjęcie lub Wideo max 30MB)';
    $show_feed     = isset($options['show_feed']) ? $options['show_feed'] : 'yes';
    $webhook_url   = $options['webhook_url'] ?? '';
?>
    <div class="wrap">
        <h1>⚙️ Kawwwa.online - Ustawienia Butikowej Księgi</h1>
        <form method="post" action="options.php">
            <?php settings_fields('kawwwa_gb_options_group'); ?>
            <table class="form-table">
                <tr>
                    <th scope="row">Kolor Tła Strony</th>
                    <td><input type="color" name="kawwwa_gb_settings[bg_body]" value="<?php echo esc_attr($bg_body); ?>" /></td>
                </tr>
                <tr>
                    <th scope="row">Kolor Karty Formularza</th>
                    <td><input type="color" name="kawwwa_gb_settings[bg_card]" value="<?php echo esc_attr($bg_card); ?>" /></td>
                </tr>
                <tr>
                    <th scope="row">Kolor Tekstu/Linii</th>
                    <td><input type="color" name="kawwwa_gb_settings[primary_color]" value="<?php echo esc_attr($primary_color); ?>" /></td>
                </tr>
                <tr>
                    <th scope="row">Kolor Akcentu</th>
                    <td><input type="color" name="kawwwa_gb_settings[accent_color]" value="<?php echo esc_attr($accent_color); ?>" /></td>
                </tr>
                <tr>
                    <th scope="row">Wysokość pola życzeń (px)</th>
                    <td><input type="number" name="kawwwa_gb_settings[msg_height]" value="<?php echo esc_attr($msg_height); ?>" style="width: 80px;" /> px</td>
                </tr>
                <tr>
                    <th scope="row">Przycisk (Normal)</th>
                    <td><input type="color" name="kawwwa_gb_settings[btn_color]" value="<?php echo esc_attr($btn_color); ?>" /></td>
                </tr>
                <tr>
                    <th scope="row">Przycisk (Hover)</th>
                    <td><input type="color" name="kawwwa_gb_settings[btn_hover]" value="<?php echo esc_attr($btn_hover); ?>" /></td>
                </tr>
                <tr>
                    <th scope="row">Pole Imiona</th>
                    <td><input type="text" name="kawwwa_gb_settings[pl_name]" value="<?php echo esc_attr($pl_name); ?>" class="regular-text" /></td>
                </tr>
                <tr>
                    <th scope="row">Pole Życzenia</th>
                    <td><input type="text" name="kawwwa_gb_settings[pl_msg]" value="<?php echo esc_attr($pl_msg); ?>" class="regular-text" /></td>
                </tr>
                <tr>
                    <th scope="row">Przycisk Pliku</th>
                    <td><input type="text" name="kawwwa_gb_settings[pl_media]" value="<?php echo esc_attr($pl_media); ?>" class="regular-text" /></td>
                </tr>
                <tr>
                    <th scope="row">Wyświetlaj wpisy?</th>
                    <td><label><input type="checkbox" name="kawwwa_gb_settings[show_feed]" value="yes" <?php checked($show_feed, 'yes'); ?> /> Tak</label></td>
                </tr>
                <tr>
                    <th scope="row">Make.com Webhook URL</th>
                    <td><input type="url" name="kawwwa_gb_settings[webhook_url]" value="<?php echo esc_url($webhook_url); ?>" class="regular-text" /></td>
                </tr>
            </table>
            <?php submit_button('Zapisz Konfigurację'); ?>
        </form>
    </div>
<?php
}

// ==========================================
// 3. FRONTEND & SHORTCODE
// ==========================================
function kawwwa_guestbook_form_shortcode()
{
    wp_enqueue_style('kawwwa-google-fonts', 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400;1,600&family=Montserrat:wght@300;400;500;600&display=swap', array(), null);
    wp_enqueue_style('kawwwa-gb-css', plugin_dir_url(__FILE__) . 'assets/kawwwa-guestbook.css', array(), '3.3.0');
    wp_enqueue_script('kawwwa-gb-js', plugin_dir_url(__FILE__) . 'assets/kawwwa-guestbook.js', array(), '3.3.0', true);

    $options = get_option('kawwwa_gb_settings', array());

    $bg_body    = $options['bg_body'] ?? '#F4EFE8';
    $bg_card    = $options['bg_card'] ?? '#FCFBF9';
    $primary    = $options['primary_color'] ?? '#5C1D24';
    $accent     = $options['accent_color'] ?? '#B69772';
    $btn_color  = $options['btn_color'] ?? '#5C1D24';
    $btn_hover  = $options['btn_hover'] ?? '#7A2A33';
    $msg_height = $options['msg_height'] ?? '150';
    $pl_name    = $options['pl_name'] ?? 'Wasze imiona (np. Ciocia Kasia i Wujek Tomek)';
    $pl_msg     = $options['pl_msg'] ?? 'Napiszcie kilka słów od serca...';
    $pl_media   = $options['pl_media'] ?? 'Dodaj pamiątkę (Zdjęcie lub Wideo max 30MB)';
    $show_feed  = isset($options['show_feed']) ? $options['show_feed'] : 'yes';

    $dynamic_css = "
        :root {
            --bg-body: {$bg_body};
            --bg-card: {$bg_card};
            --text-burgundy: {$primary};
            --gold-accent: {$accent};
            --btn-color: {$btn_color};
            --btn-hover: {$btn_hover};
            --msg-height: {$msg_height}px;
        }
    ";
    wp_add_inline_style('kawwwa-gb-css', $dynamic_css);

    wp_localize_script('kawwwa-gb-js', 'kawwwaGB', array(
        'apiUrl'  => esc_url_raw(rest_url('kawwwa/v1/guestbook')),
        'nonce'   => wp_create_nonce('wp_rest'),
        'plMedia' => esc_html($pl_media)
    ));

    ob_start();
?>
    <div class="guestbook-container">
        <section class="add-entry-card">
            <form action="#" method="POST" id="kawwwa-guestbook-form" enctype="multipart/form-data">
                <div class="form-group"><input type="text" id="guestName" name="guest_name" class="form-control" placeholder="<?php echo esc_attr($pl_name); ?>" required></div>
                <div class="form-group"><textarea id="guestMessage" name="guest_message" class="form-control" placeholder="<?php echo esc_attr($pl_msg); ?>" required></textarea></div>
                <div class="media-upload-wrapper">
                    <input type="file" name="guest_media" id="file" class="file-input" accept="image/*,video/mp4,video/quicktime,video/mov">
                    <label for="file" class="file-label" id="fileLabel">
                        <svg viewBox="0 0 24 24">
                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                            <circle cx="12" cy="13" r="4"></circle>
                        </svg>
                        <span><?php echo esc_html($pl_media); ?></span>
                    </label>
                </div>
                <div id="kawwwa-form-response" style="text-align: center; margin-bottom: 20px; font-weight: 600;"></div>
                <button type="submit" id="gb-submit-btn" class="btn-submit">Wyślij wpis do księgi</button>
            </form>
        </section>

        <?php if ($show_feed === 'yes') : ?>
            <div class="feed-divider">Dotychczasowe wpisy</div>
            <div class="entries-feed">
                <?php
                $gb_query = new WP_Query(array('post_type' => 'ksiega_gosci', 'posts_per_page' => 100, 'post_status' => 'publish'));

                if ($gb_query->have_posts()) :
                    while ($gb_query->have_posts()) : $gb_query->the_post();
                ?>
                        <article class="entry-card observe-me">
                            <?php
                            // Renderowanie wideo na froncie 
                            $video_id = get_post_meta(get_the_ID(), '_guest_video_id', true);

                            if ($video_id) :
                                $video_url = wp_get_attachment_url($video_id);
                            ?>
                                <video controls src="<?php echo esc_url($video_url); ?>" style="width: 100%; max-height: 400px; border-radius: 3px; margin-bottom: 20px; background: #000;"></video>
                            <?php elseif (has_post_thumbnail()) : ?>
                                <?php the_post_thumbnail('large', array('class' => 'entry-photo')); ?>
                            <?php endif; ?>

                            <p class="entry-message">"<?php echo esc_html(get_the_content()); ?>"</p>

                            <div class="entry-meta">
                                <span class="entry-author"><?php the_title(); ?></span>
                                <span class="entry-time"><?php echo get_the_date('H:i, d.m.Y'); ?></span>
                            </div>
                        </article>
                <?php
                    endwhile;
                    wp_reset_postdata();
                else :
                    echo '<p style="text-align:center;">Bądź pierwszą osobą, która zostawi życzenia!</p>';
                endif;
                ?>
            </div>
        <?php endif; ?>
    </div>
<?php
    return ob_get_clean();
}
add_shortcode('kawwwa_formularz_ksiegi', 'kawwwa_guestbook_form_shortcode');

// ==========================================
// 4. REST API (BACKEND) - PANCERNA WALIDACJA WIDEO
// ==========================================
add_action('rest_api_init', function () {
    register_rest_route('kawwwa/v1', '/guestbook', array(
        'methods'             => 'POST',
        'callback'            => 'kawwwa_handle_guestbook_submission',
        'permission_callback' => '__return_true'
    ));
});

function kawwwa_handle_guestbook_submission(WP_REST_Request $request)
{
    $nonce = $request->get_header('X-WP-Nonce');
    if (! wp_verify_nonce($nonce, 'wp_rest')) {
        return new WP_REST_Response(array('success' => false, 'message' => 'Błąd sesji. Odśwież stronę.'), 403);
    }

    $name = sanitize_text_field($request->get_param('guest_name'));
    $message = sanitize_textarea_field($request->get_param('guest_message'));

    if (empty($name) || empty($message)) {
        return new WP_REST_Response(array('success' => false, 'message' => 'Wypełnij wymagane pola.'), 400);
    }

    $has_file = isset($_FILES['guest_media']) && $_FILES['guest_media']['error'] !== UPLOAD_ERR_NO_FILE;

    if ($has_file && $_FILES['guest_media']['error'] !== UPLOAD_ERR_OK) {
        return new WP_REST_Response(array('success' => false, 'message' => 'Plik odrzucony (Kod PHP: ' . $_FILES['guest_media']['error'] . ').'), 400);
    }

    $post_id = wp_insert_post(array(
        'post_title'   => $name,
        'post_content' => $message,
        'post_status'  => 'publish',
        'post_type'    => 'ksiega_gosci'
    ));

    if (is_wp_error($post_id)) {
        return new WP_REST_Response(array('success' => false, 'message' => 'Błąd bazy danych.'), 500);
    }

    if ($has_file) {
        require_once(ABSPATH . 'wp-admin/includes/image.php');
        require_once(ABSPATH . 'wp-admin/includes/file.php');
        require_once(ABSPATH . 'wp-admin/includes/media.php');

        $attach_id = media_handle_upload('guest_media', $post_id);

        if (is_wp_error($attach_id)) {
            return new WP_REST_Response(array('success' => false, 'message' => 'Błąd: ' . $attach_id->get_error_message()), 500);
        }

        // Twarda weryfikacja po nazwie pliku, a nie tylko MIME (ratuje iPhone'y)
        $file_url  = wp_get_attachment_url($attach_id);
        $mime_type = get_post_mime_type($attach_id);
        $ext       = strtolower(pathinfo($file_url, PATHINFO_EXTENSION));

        $is_video  = (strpos($mime_type, 'video') !== false || in_array($ext, array('mp4', 'mov', 'webm')));

        if ($is_video) {
            // Rejestrujemy wideo
            update_post_meta($post_id, '_guest_video_id', $attach_id);

            // Wysyłamy Webhook (Timeout zwiększony do 3s, żeby SSL zdążył zaskoczyć)
            $options = get_option('kawwwa_gb_settings', array());
            $webhook_url = $options['webhook_url'] ?? '';

            if (! empty($webhook_url) && filter_var($webhook_url, FILTER_VALIDATE_URL)) {
                $payload = array(
                    'post_id'    => $post_id,
                    'guest_name' => $name,
                    'video_url'  => $file_url,
                    'media_id'   => $attach_id
                );
                wp_remote_post($webhook_url, array(
                    'method'      => 'POST',
                    'timeout'     => 3,
                    'blocking'    => false,
                    'headers'     => array('Content-Type' => 'application/json; charset=utf-8'),
                    'body'        => wp_json_encode($payload)
                ));
            }
        } elseif (strpos($mime_type, 'image') !== false) {
            // Rejestrujemy zdjęcie
            set_post_thumbnail($post_id, $attach_id);
        } else {
            // Usuwamy nieobsługiwane pliki
            wp_delete_attachment($attach_id, true);
            return new WP_REST_Response(array('success' => false, 'message' => 'Nieobsługiwany format pliku.'), 400);
        }
    }

    return new WP_REST_Response(array('success' => true, 'message' => 'Dziękujemy! Pamiątka została dodana.'), 200);
}
