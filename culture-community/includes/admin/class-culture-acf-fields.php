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
                    'key' => 'field_event_ticketing_url',
                    'label' => 'External Ticketing URL (Optional)',
                    'name' => 'ticketing_url',
                    'type' => 'url',
                    'instructions' => 'If provided, the RSVP form will be replaced by a "Buy Ticket" button linking here.',
                    'wrapper' => array( 'width' => '50' ),
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

        // Journey Meta Fields Group
        acf_add_local_field_group( array(
            'key'      => 'group_journey_meta',
            'title'    => 'Journey Details',
            'fields'   => array(
                array(
                    'key'               => 'field_journey_edition',
                    'label'             => 'Edition',
                    'name'              => 'journey_edition',
                    'type'              => 'text',
                    'instructions'      => 'e.g., N°04, Lagos Edition',
                    'placeholder'       => 'N°04',
                    'maxlength'         => 100,
                    'show_in_graphql'   => 1,
                ),
                array(
                    'key'               => 'field_journey_dates',
                    'label'             => 'Journey Dates',
                    'name'              => 'journey_dates',
                    'type'              => 'text',
                    'instructions'      => 'e.g., 19–23 April 2026',
                    'placeholder'       => '19–23 April 2026',
                    'maxlength'         => 150,
                    'show_in_graphql'   => 1,
                ),
                array(
                    'key'               => 'field_journey_location',
                    'label'             => 'Location',
                    'name'              => 'journey_location',
                    'type'              => 'text',
                    'instructions'      => 'City or destination',
                    'placeholder'       => 'Lagos, Nigeria',
                    'maxlength'         => 150,
                    'show_in_graphql'   => 1,
                ),
                array(
                    'key'               => 'field_journey_price',
                    'label'             => 'Price',
                    'name'              => 'journey_price',
                    'type'              => 'text',
                    'instructions'      => 'e.g., $4,200 USD',
                    'placeholder'       => '$4,200 USD',
                    'maxlength'         => 150,
                    'show_in_graphql'   => 1,
                ),
                array(
                    'key'               => 'field_journey_spots',
                    'label'             => 'Available Spots',
                    'name'              => 'journey_spots',
                    'type'              => 'text',
                    'instructions'      => 'Number of remaining spots',
                    'placeholder'       => '7',
                    'maxlength'         => 20,
                    'show_in_graphql'   => 1,
                ),
                array(
                    'key'               => 'field_journey_status',
                    'label'             => 'Status',
                    'name'              => 'journey_status',
                    'type'              => 'select',
                    'instructions'      => 'Current status of the journey',
                    'choices'           => array(
                        'active'        => 'Active (Currently Booking)',
                        'upcoming'      => 'Upcoming (Not Yet Open)',
                        'completed'     => 'Completed (Sold Out/Past)',
                    ),
                    'default_value'     => 'upcoming',
                    'allow_null'        => 0,
                    'show_in_graphql'   => 1,
                ),
                array(
                    'key'               => 'field_journey_inclusions',
                    'label'             => 'What\'s Included',
                    'name'              => 'journey_inclusions',
                    'type'              => 'textarea',
                    'instructions'      => 'Included items/services (optional)',
                    'placeholder'       => 'Accommodation, meals, guided experiences...',
                    'show_in_graphql'   => 1,
                ),
                array(
                    'key'               => 'field_journey_exclusions',
                    'label'             => 'What\'s Not Included',
                    'name'              => 'journey_exclusions',
                    'type'              => 'textarea',
                    'instructions'      => 'Not included items (optional)',
                    'placeholder'       => 'International flights, travel insurance...',
                    'show_in_graphql'   => 1,
                ),
            ),
            'location' => array(
                array(
                    array(
                        'param'    => 'post_type',
                        'operator' => '==',
                        'value'    => 'culture_journey',
                    ),
                ),
            ),
            'menu_order'        => 0,
            'position'          => 'normal',
            'style'             => 'default',
            'label_placement'   => 'top',
            'instruction_placement' => 'label',
            'show_in_graphql'   => 1,
        ) );

        // Journey Itinerary Group
        acf_add_local_field_group( array(
            'key'      => 'group_journey_itinerary',
            'title'    => 'Itinerary',
            'fields'   => array(
                array(
                    'key'               => 'field_journey_itinerary',
                    'label'             => 'Days',
                    'name'              => 'journey_itinerary',
                    'type'              => 'repeater',
                    'instructions'      => 'Add each day of the journey',
                    'min'               => 0,
                    'max'               => '',
                    'layout'            => 'block',
                    'button_label'      => 'Add Day',
                    'show_in_graphql'   => 1,
                    'sub_fields'        => array(
                        array(
                            'key'               => 'field_day_number',
                            'label'             => 'Day Number',
                            'name'              => 'day_number',
                            'type'              => 'text',
                            'placeholder'       => '1',
                            'maxlength'         => 10,
                            'show_in_graphql'   => 1,
                        ),
                        array(
                            'key'               => 'field_day_title',
                            'label'             => 'Title',
                            'name'              => 'day_title',
                            'type'              => 'text',
                            'placeholder'       => 'Market at Dawn',
                            'show_in_graphql'   => 1,
                        ),
                        array(
                            'key'               => 'field_day_location',
                            'label'             => 'Location',
                            'name'              => 'day_location',
                            'type'              => 'text',
                            'placeholder'       => 'Lekki Arts District',
                            'show_in_graphql'   => 1,
                        ),
                        array(
                            'key'               => 'field_day_description',
                            'label'             => 'Description',
                            'name'              => 'day_description',
                            'type'              => 'textarea',
                            'placeholder'       => 'What happens on this day...',
                            'rows'              => 3,
                            'show_in_graphql'   => 1,
                        ),
                        array(
                            'key'               => 'field_day_activities',
                            'label'             => 'Activities',
                            'name'              => 'activities',
                            'type'              => 'repeater',
                            'min'               => 0,
                            'max'               => '',
                            'layout'            => 'table',
                            'button_label'      => 'Add Activity',
                            'show_in_graphql'   => 1,
                            'sub_fields'        => array(
                                array(
                                    'key'               => 'field_activity_time',
                                    'label'             => 'Time',
                                    'name'              => 'activity_time',
                                    'type'              => 'text',
                                    'placeholder'       => '09:00',
                                    'maxlength'         => 20,
                                    'show_in_graphql'   => 1,
                                ),
                                array(
                                    'key'               => 'field_activity_title',
                                    'label'             => 'Title',
                                    'name'              => 'activity_title',
                                    'type'              => 'text',
                                    'placeholder'       => 'Studio visit with artist',
                                    'show_in_graphql'   => 1,
                                ),
                                array(
                                    'key'               => 'field_activity_description',
                                    'label'             => 'Description',
                                    'name'              => 'activity_description',
                                    'type'              => 'textarea',
                                    'placeholder'       => 'What we\'ll do...',
                                    'rows'              => 2,
                                    'show_in_graphql'   => 1,
                                ),
                                array(
                                    'key'               => 'field_activity_type',
                                    'label'             => 'Type',
                                    'name'              => 'activity_type',
                                    'type'              => 'select',
                                    'choices'           => array(
                                        'anchor'    => 'Cultural Anchor',
                                        'include'   => 'Included',
                                        'members'   => 'Members Only',
                                    ),
                                    'allow_null'        => 1,
                                    'show_in_graphql'   => 1,
                                ),
                            ),
                        ),
                    ),
                ),
            ),
            'location' => array(
                array(
                    array(
                        'param'    => 'post_type',
                        'operator' => '==',
                        'value'    => 'culture_journey',
                    ),
                ),
            ),
            'menu_order'        => 1,
            'position'          => 'normal',
            'style'             => 'default',
            'label_placement'   => 'top',
            'instruction_placement' => 'label',
            'show_in_graphql'   => 1,
        ) );

        // Journey Hosts Group
        acf_add_local_field_group( array(
            'key'      => 'group_journey_hosts',
            'title'    => 'Hosts',
            'fields'   => array(
                array(
                    'key'               => 'field_journey_hosts',
                    'label'             => 'Hosts',
                    'name'              => 'journey_hosts',
                    'type'              => 'repeater',
                    'instructions'      => 'Add resident hosts/guides for this journey',
                    'min'               => 0,
                    'max'               => '',
                    'layout'            => 'block',
                    'button_label'      => 'Add Host',
                    'show_in_graphql'   => 1,
                    'sub_fields'        => array(
                        array(
                            'key'               => 'field_host_name',
                            'label'             => 'Name',
                            'name'              => 'host_name',
                            'type'              => 'text',
                            'placeholder'       => 'Full name',
                            'show_in_graphql'   => 1,
                        ),
                        array(
                            'key'               => 'field_host_role',
                            'label'             => 'Role',
                            'name'              => 'host_role',
                            'type'              => 'text',
                            'placeholder'       => 'Curator, Artist, Musician',
                            'show_in_graphql'   => 1,
                        ),
                        array(
                            'key'               => 'field_host_bio',
                            'label'             => 'Biography',
                            'name'              => 'host_bio',
                            'type'              => 'textarea',
                            'placeholder'       => 'Who they are and what they do...',
                            'rows'              => 3,
                            'show_in_graphql'   => 1,
                        ),
                        array(
                            'key'               => 'field_host_image',
                            'label'             => 'Image',
                            'name'              => 'host_image',
                            'type'              => 'image',
                            'return_format'     => 'id',
                            'preview_size'      => 'thumbnail',
                            'library'           => 'all',
                            'show_in_graphql'   => 1,
                        ),
                    ),
                ),
            ),
            'location' => array(
                array(
                    array(
                        'param'    => 'post_type',
                        'operator' => '==',
                        'value'    => 'culture_journey',
                    ),
                ),
            ),
            'menu_order'        => 2,
            'position'          => 'normal',
            'style'             => 'default',
            'label_placement'   => 'top',
            'instruction_placement' => 'label',
            'show_in_graphql'   => 1,
        ) );
    }
}
