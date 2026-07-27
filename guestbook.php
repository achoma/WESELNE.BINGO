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
