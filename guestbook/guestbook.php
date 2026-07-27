<?php

/**
 * Plugin Name: Kawwwa - Cyfrowa Księga Gości
 * Description: Moduł Premium dla stron ślubnych. Obsługa życzeń, wideo (Google Drive) i zdjęć.
 * Version: 1.0.0
 * Author: kawwwa.online
 */

if (! defined('ABSPATH')) {
    exit;
}

function kawwwa_register_guestbook_cpt()
{
    $labels = array(
        'name'                  => 'Księga Gości',
        'singular_name'         => 'Wpis w Księdze',
        'menu_name'             => 'Księga Gości',
        'add_new'               => 'Dodaj nowy wpis',
        'add_new_item'          => 'Dodaj nowy wpis w księdze',
        'edit_item'             => 'Edytuj wpis',
        'all_items'             => 'Wszystkie wpisy'
    );

    $args = array(
        'labels'             => $labels,
        'public'             => true,
        'publicly_queryable' => false,
        'show_ui'            => true,
        'show_in_menu'       => true,
        'query_var'          => true,
        'rewrite'            => array('slug' => 'ksiega-gosci'),
        'capability_type'    => 'post',
        'has_archive'        => false,
        'hierarchical'       => false,
        'menu_position'      => 25,
        'menu_icon'          => 'dashicons-book-alt',
        'supports'           => array('title', 'editor', 'thumbnail', 'custom-fields'),
    );

    register_post_type('ksiega_gosci', $args);
}
add_action('init', 'kawwwa_register_guestbook_cpt');



// =========================================================================
// KROK 2: REST API & Formularz Front-endowy
// =========================================================================

/**
 * 1. Rejestracja niestandardowego Endpointu (Nasz "Urząd Celny")
 */
function kawwwa_register_guestbook_endpoint()
{
    register_rest_route('kawwwa/v1', '/guestbook', array(
        'methods'             => 'POST',
        'callback'            => 'kawwwa_handle_guestbook_submission',
        'permission_callback' => '__return_true' // Formularz publiczny dla gości
    ));
}
add_action('rest_api_init', 'kawwwa_register_guestbook_endpoint');

/**
 * 2. Rejestracja Shortcodu z formularzem
 */
function kawwwa_guestbook_form_shortcode()
{
    // Ładujemy JS tylko na stronie z shortcodem (Anti-Bloatware / Wydajność)
    wp_enqueue_script('kawwwa-gb-js', plugin_dir_url(__FILE__) . 'assets/kawwwa-guestbook.js', array(), '1.0.0', true);

    // Przekazujemy do JS bezpieczny Nonce (Klucz) i URL naszego API
    wp_localize_script('kawwwa-gb-js', 'kawwwaGB', array(
        'apiUrl' => esc_url_raw(rest_url('kawwwa/v1/guestbook')),
        'nonce'  => wp_create_nonce('wp_rest')
    ));

    // Zwracamy czysty HTML. Plik (wideo) dodamy w kolejnym kroku, najpierw testujemy połączenie bazy.
    ob_start();
?>
    <div id="kawwwa-guestbook-wrapper">
        <form id="kawwwa-guestbook-form" class="kawwwa-form">
            <div class="kawwwa-form-group">
                <label for="gb-name">Wasze Imiona</label>
                <input type="text" id="gb-name" name="guest_name" required>
            </div>
            <div class="kawwwa-form-group">
                <label for="gb-message">Życzenia</label>
                <textarea id="gb-message" name="guest_message" rows="4" required></textarea>
            </div>

            <div id="kawwwa-form-response" style="margin-top: 15px; font-weight: bold;"></div>

            <button type="submit" id="gb-submit-btn" style="margin-top: 15px;">Zostaw Życzenia</button>
        </form>
    </div>
<?php
    return ob_get_clean();
}
add_shortcode('kawwwa_formularz_ksiegi', 'kawwwa_guestbook_form_shortcode');

/**
 * 3. Logika odbioru i zapisu danych do CPT (Precyzja & Bezpieczeństwo)
 */
function kawwwa_handle_guestbook_submission(WP_REST_Request $request)
{
    // Walidacja Nonce - mur obronny (Security)
    $nonce = $request->get_header('X-WP-Nonce');
    if (! wp_verify_nonce($nonce, 'wp_rest')) {
        return new WP_REST_Response(array('success' => false, 'message' => 'Błąd autoryzacji sesji. Odśwież stronę.'), 403);
    }

    // Oczyszczanie danych wejściowych (Sanityzacja)
    $name = sanitize_text_field($request->get_param('guest_name'));
    $message = sanitize_textarea_field($request->get_param('guest_message'));

    if (empty($name) || empty($message)) {
        return new WP_REST_Response(array('success' => false, 'message' => 'Proszę wypełnić wszystkie pola.'), 400);
    }

    // Zapis wpisu do naszej bazy CPT
    $post_id = wp_insert_post(array(
        'post_title'   => $name,
        'post_content' => $message,
        'post_status'  => 'publish', // Automatyczna publikacja (można zmienić na 'pending')
        'post_type'    => 'ksiega_gosci'
    ));

    if (is_wp_error($post_id)) {
        return new WP_REST_Response(array('success' => false, 'message' => 'Wystąpił błąd podczas zapisu w bazie.'), 500);
    }

    return new WP_REST_Response(array(
        'success' => true,
        'message' => 'Dziękujemy! Wasze życzenia zostały dodane.'
    ), 200);
}
