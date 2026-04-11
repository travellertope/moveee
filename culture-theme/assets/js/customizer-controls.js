/**
 * Culture Theme — Customizer panel controls.
 *
 * Conditionally shows/hides hero background controls
 * based on the selected background type.
 */
(function() {
    'use strict';

    wp.customize.bind( 'ready', function() {

        var solidControls   = [ 'culture_hero_bg_color' ];
        var gradientControls = [
            'culture_hero_gradient_start',
            'culture_hero_gradient_end',
            'culture_hero_gradient_angle'
        ];
        var imageControls = [
            'culture_hero_bg_image',
            'culture_hero_overlay_color',
            'culture_hero_overlay_opacity'
        ];

        function toggleHeroBgControls( val ) {
            solidControls.forEach( function( id ) {
                var ctrl = wp.customize.control( id );
                if ( ctrl ) { ctrl.toggle( val === 'solid' ); }
            } );
            gradientControls.forEach( function( id ) {
                var ctrl = wp.customize.control( id );
                if ( ctrl ) { ctrl.toggle( val === 'gradient' ); }
            } );
            imageControls.forEach( function( id ) {
                var ctrl = wp.customize.control( id );
                if ( ctrl ) { ctrl.toggle( val === 'image' ); }
            } );
        }

        // Bind to changes.
        wp.customize( 'culture_hero_bg_type', function( setting ) {
            setting.bind( toggleHeroBgControls );
            // Fire on load.
            toggleHeroBgControls( setting.get() );
        } );

    } );

})();
