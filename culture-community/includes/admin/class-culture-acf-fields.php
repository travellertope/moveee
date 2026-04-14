<?php
/**
 * Register programmatic ACF fields for the Culture Community plugin.
 * This ensures fields like Location, Admission and Featured Status 
 * are available across all systems without manual configuration.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Culture_ACF_Fields {

    public static function init() {
        if ( function_exists( 'acf_add_local_field_group' ) ) {
            add_action( 'acf/init', array( __CLASS__, 'register_field_groups' ) );
        }
    }

    /**
     * Register ACF Field Groups
     */
    public static function register_field_groups() {
        // Event Editorial Details
        acf_add_local_field_group( array(
            'key' => 'group_culture_event_details',
            'title' => 'Event Editorial Details',
            'fields' => array(
                array(
                    'key' => 'field_event_location',
                    'label' => 'Venue / Location',
                    'name' => 'location',
                    'type' => 'text',
                    'instructions' => 'Specific venue name or location (e.g. "Ikoyi, Lagos")',
                    'required' => 0,
                    'conditional_logic' => 0,
                    'wrapper' => array(
                        'width' => '50',
                        'class' => '',
                        'id' => '',
                    ),
                    'default_value' => '',
                    'placeholder' => 'e.g. Lagos, Nigeria',
                    'prepend' => '',
                    'append' => '',
                    'maxlength' => '',
                ),
                array(
                    'key' => 'field_event_is_featured',
                    'label' => 'Spotlight Event',
                    'name' => 'is_featured',
                    'type' => 'true_false',
                    'instructions' => 'Feature this event at the top of the events landing page.',
                    'required' => 0,
                    'conditional_logic' => 0,
                    'wrapper' => array(
                        'width' => '25',
                        'class' => '',
                        'id' => '',
                    ),
                    'message' => 'Show in Spotlight',
                    'default_value' => 0,
                    'ui' => 1,
                    'ui_on_text' => 'Featured',
                    'ui_off_text' => 'Normal',
                ),
                array(
                    'key' => 'field_event_admission',
                    'label' => 'Admission / Ticket Info',
                    'name' => 'admission',
                    'type' => 'text',
                    'instructions' => 'e.g. "Free", "$10", "Member Exclusive"',
                    'required' => 0,
                    'conditional_logic' => 0,
                    'wrapper' => array(
                        'width' => '25',
                        'class' => '',
                        'id' => '',
                    ),
                    'default_value' => 'Free',
                    'placeholder' => '',
                    'prepend' => '',
                    'append' => '',
                    'maxlength' => '',
                ),
            ),
            'location' => array(
                array(
                    array(
                        'param' => 'post_type',
                        'operator' => '==',
                        'value' => 'culture_event',
                    ),
                ),
            ),
            'menu_order' => 0,
            'position' => 'normal',
            'style' => 'default',
            'label_placement' => 'top',
            'instruction_placement' => 'label',
            'hide_on_screen' => '',
            'active' => true,
            'description' => '',
            'show_in_graphql' => true,
            'graphql_field_name' => 'eventDetails',
        ) );
    }
}
