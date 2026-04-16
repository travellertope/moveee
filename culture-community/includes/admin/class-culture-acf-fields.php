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
        // Register field groups when ACF is ready.
        add_action( 'acf/init', array( __CLASS__, 'register_field_groups' ) );
    }

    /**
     * Register ACF Field Groups
     */
    public static function register_field_groups() {
        // Check if ACF is available before registering.
        if ( ! function_exists( 'acf_add_local_field_group' ) ) {
            return;
        }

        // Directory Talent Details
        acf_add_local_field_group( array(
            'key' => 'group_culture_directory_talent',
            'title' => 'Talent / Professional Details',
            'fields' => array(
                array(
                    'key' => 'field_dir_website',
                    'label' => 'Website URL',
                    'name' => 'website_url',
                    'type' => 'url',
                    'wrapper' => array( 'width' => '50' ),
                ),
                array(
                    'key' => 'field_dir_instagram',
                    'label' => 'Instagram Handle',
                    'name' => 'instagram_handle',
                    'type' => 'text',
                    'prepend' => '@',
                    'wrapper' => array( 'width' => '25' ),
                ),
                array(
                    'key' => 'field_dir_twitter',
                    'label' => 'Twitter / X Handle',
                    'name' => 'twitter_handle',
                    'type' => 'text',
                    'prepend' => '@',
                    'wrapper' => array( 'width' => '25' ),
                ),
                array(
                    'key' => 'field_dir_works',
                    'label' => 'Selected Works / Portfolio',
                    'name' => 'selected_works',
                    'type' => 'repeater',
                    'layout' => 'table',
                    'button_label' => 'Add Work',
                    'sub_fields' => array(
                        array(
                            'key' => 'field_work_title',
                            'label' => 'Work Title',
                            'name' => 'title',
                            'type' => 'text',
                        ),
                        array(
                            'key' => 'field_work_image',
                            'label' => 'Image',
                            'name' => 'image',
                            'type' => 'image',
                            'return_format' => 'id',
                        ),
                    ),
                ),
            ),
            'location' => array(
                array(
                    array(
                        'param' => 'post_type',
                        'operator' => '==',
                        'value' => 'culture_directory',
                    ),
                ),
            ),
        ) );

        // Event Editorial Details
        acf_add_local_field_group( array(
            'key' => 'group_culture_event_details',
            'title' => 'Event Editorial Details',
            'fields' => array(
                array(
                    'key' => 'field_event_host_entry',
                    'label' => 'Featured Host / Artist',
                    'name' => 'featured_host',
                    'type' => 'post_object',
                    'instructions' => 'Link this event to a Talent entry in the Directory.',
                    'post_type' => array( 'culture_directory' ),
                    'allow_null' => 1,
                    'multiple' => 0,
                    'return_format' => 'id',
                    'ui' => 1,
                    'wrapper' => array( 'width' => '50' ),
                ),
                array(
                    'key' => 'field_event_attribution',
                    'label' => 'Attribution / Credit',
                    'name' => 'attribution',
                    'type' => 'text',
                    'instructions' => 'e.g. "Paintings by Ifeoma Okoli" or "Curated by DJ Sose"',
                    'placeholder' => 'By [Name]',
                    'wrapper' => array( 'width' => '50' ),
                ),
                array(
                    'key' => 'field_event_location',
                    'label' => 'Venue / Location',
                    'name' => 'location',
                    'type' => 'text',
                    'instructions' => 'Specific venue name or location (e.g. "Ikoyi, Lagos")',
                    'wrapper' => array( 'width' => '50' ),
                ),
                array(
                    'key' => 'field_event_opening_hours',
                    'label' => 'Opening / Gallery Hours',
                    'name' => 'opening_hours',
                    'type' => 'textarea',
                    'instructions' => 'e.g. "Tuesday – Saturday: 11 AM – 6 PM"',
                    'rows' => 2,
                    'wrapper' => array( 'width' => '50' ),
                ),
                array(
                    'key' => 'field_event_end_date',
                    'label' => 'Event End Date (Optional)',
                    'name' => 'end_date',
                    'type' => 'date_time_picker',
                    'display_format' => 'd/m/Y g:i a',
                    'return_format' => 'Y-m-d H:i:s',
                    'wrapper' => array( 'width' => '50' ),
                ),
                array(
                    'key' => 'field_event_associated_journey',
                    'label' => 'Accompanying Journey',
                    'name' => 'associated_journey',
                    'type' => 'post_object',
                    'instructions' => 'Link an Origins Journey to this event.',
                    'post_type' => array( 'culture_journey' ),
                    'allow_null' => 1,
                    'multiple' => 0,
                    'return_format' => 'id',
                    'ui' => 1,
                    'wrapper' => array( 'width' => '50' ),
                ),
                array(
                    'key' => 'field_event_tagline',
                    'label' => 'Event Pull-Quote / Tagline',
                    'name' => 'tagline',
                    'type' => 'textarea',
                    'rows' => 2,
                ),
                array(
                    'key' => 'field_event_press_group',
                    'label' => 'Press & Media Details',
                    'name' => 'press_details',
                    'type' => 'group',
                    'layout' => 'block',
                    'sub_fields' => array(
                        array(
                            'key' => 'field_press_eyebrow',
                            'label' => 'Section Eyebrow',
                            'name' => 'eyebrow',
                            'type' => 'text',
                            'default_value' => 'Press & Media',
                        ),
                        array(
                            'key' => 'field_press_title',
                            'label' => 'Heading',
                            'name' => 'title',
                            'type' => 'text',
                            'default_value' => 'Press enquiries',
                        ),
                        array(
                            'key' => 'field_press_content',
                            'label' => 'Body Text',
                            'name' => 'content',
                            'type' => 'textarea',
                            'rows' => 3,
                        ),
                        array(
                            'key' => 'field_press_link',
                            'label' => 'Contact Link / Email',
                            'name' => 'link',
                            'type' => 'text',
                            'placeholder' => 'mailto:press@themoveee.com',
                        ),
                    ),
                ),
                array(
                    'key' => 'field_event_is_featured',
                    'label' => 'Spotlight Event',
                    'name' => 'is_featured',
                    'type' => 'true_false',
                    'instructions' => 'Feature this event at the top of the events landing page.',
                    'wrapper' => array( 'width' => '25' ),
                    'message' => 'Show in Spotlight',
                    'ui' => 1,
                ),
                array(
                    'key' => 'field_event_admission',
                    'label' => 'Admission / Ticket Info',
                    'name' => 'admission',
                    'type' => 'text',
                    'instructions' => 'e.g. "Free", "$10", "Member Exclusive"',
                    'default_value' => 'Free',
                    'wrapper' => array( 'width' => '25' ),
                ),
                array(
                    'key' => 'field_event_metrics',
                    'label' => 'Key Highlights / Metrics',
                    'name' => 'metrics',
                    'type' => 'repeater',
                    'layout' => 'table',
                    'wrapper' => array( 'width' => '50' ),
                    'button_label' => 'Add Highlight',
                    'sub_fields' => array(
                        array(
                            'key' => 'field_metric_label',
                            'label' => 'Label',
                            'name' => 'label',
                            'type' => 'text',
                            'placeholder' => 'e.g. Paintings',
                        ),
                        array(
                            'key' => 'field_metric_value',
                            'label' => 'Value',
                            'name' => 'value',
                            'type' => 'text',
                            'placeholder' => 'e.g. 25+',
                        ),
                    ),
                ),
                array(
                    'key' => 'field_event_schedule',
                    'label' => 'Managed Program / Schedule',
                    'name' => 'schedule',
                    'type' => 'repeater',
                    'layout' => 'block',
                    'button_label' => 'Add Session',
                    'sub_fields' => array(
                        array(
                            'key' => 'field_session_time',
                            'label' => 'Time / Period',
                            'name' => 'time',
                            'type' => 'text',
                            'placeholder' => 'e.g. 18:00 or Sat 11 April',
                            'wrapper' => array( 'width' => '30' ),
                        ),
                        array(
                            'key' => 'field_session_title',
                            'label' => 'Session Title',
                            'name' => 'title',
                            'type' => 'text',
                            'wrapper' => array( 'width' => '40' ),
                        ),
                        array(
                            'key' => 'field_session_access',
                            'label' => 'Access Level',
                            'name' => 'access',
                            'type' => 'select',
                            'choices' => array(
                                'public' => 'Public Access',
                                'member' => 'Members Only',
                                'patron' => 'Patron Only',
                            ),
                            'wrapper' => array( 'width' => '30' ),
                        ),
                        array(
                            'key' => 'field_session_desc',
                            'label' => 'Brief Description',
                            'name' => 'description',
                            'type' => 'textarea',
                            'rows' => 2,
                        ),
                    ),
                ),
                array(
                    'key' => 'field_event_showcase',
                    'label' => 'Showcase Items (Works / Gallery)',
                    'name' => 'showcase',
                    'type' => 'repeater',
                    'layout' => 'block',
                    'button_label' => 'Add Showcase Item',
                    'sub_fields' => array(
                        array(
                            'key' => 'field_showcase_image',
                            'label' => 'Image',
                            'name' => 'image',
                            'type' => 'image',
                            'return_format' => 'id',
                            'wrapper' => array( 'width' => '30' ),
                        ),
                        array(
                            'key' => 'field_showcase_title',
                            'label' => 'Title',
                            'name' => 'title',
                            'type' => 'text',
                            'wrapper' => array( 'width' => '70' ),
                        ),
                        array(
                            'key' => 'field_showcase_media',
                            'label' => 'Media / Type',
                            'name' => 'media',
                            'type' => 'text',
                            'placeholder' => 'e.g. Oil on Canvas',
                            'wrapper' => array( 'width' => '25' ),
                        ),
                        array(
                            'key' => 'field_showcase_dimensions',
                            'label' => 'Dimensions',
                            'name' => 'dimensions',
                            'type' => 'text',
                            'placeholder' => 'e.g. 90x120cm',
                            'wrapper' => array( 'width' => '25' ),
                        ),
                        array(
                            'key' => 'field_showcase_year',
                            'label' => 'Year',
                            'name' => 'year',
                            'type' => 'text',
                            'wrapper' => array( 'width' => '25' ),
                        ),
                        array(
                            'key' => 'field_showcase_price',
                            'label' => 'Price / SKU',
                            'name' => 'price',
                            'type' => 'text',
                            'wrapper' => array( 'width' => '25' ),
                        ),
                    ),
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
        ) );
    }
}
