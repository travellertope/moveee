/* global Chart, culturaNLAChartData */
( function () {
    'use strict';

    if ( typeof Chart === 'undefined' ) {
        return;
    }

    var data = window.culturaNLAChartData;
    if ( ! data ) {
        return;
    }

    var baseStyle = {
        borderWidth:     2,
        pointRadius:     3,
        pointHoverRadius: 5,
        tension:         0.35,
        fill:            true,
    };

    var axisStyle = {
        ticks:  { font: { size: 11 }, color: '#646970' },
        grid:   { color: 'rgba(0,0,0,.06)' },
    };

    var tooltipStyle = {
        backgroundColor: '#1d2327',
        padding:         8,
        cornerRadius:    4,
        titleFont:       { size: 11 },
        bodyFont:        { size: 11 },
    };

    /* ── Opens chart ────────────────────────────────────────────────────────── */
    var opensCanvas = document.getElementById( 'chart-opens' );
    if ( opensCanvas && data.opens && data.opens.labels.length ) {
        new Chart( opensCanvas, {
            type: 'line',
            data: {
                labels:   data.opens.labels,
                datasets: [ {
                    label:            'Opens',
                    data:             data.opens.data,
                    borderColor:      '#2271b1',
                    backgroundColor:  'rgba(34,113,177,.12)',
                    ...baseStyle,
                } ],
            },
            options: {
                responsive:          true,
                maintainAspectRatio: true,
                plugins: {
                    legend:  { display: false },
                    tooltip: tooltipStyle,
                },
                scales: {
                    x: { ...axisStyle, display: data.opens.labels.length > 1 },
                    y: { ...axisStyle, beginAtZero: true, ticks: { ...axisStyle.ticks, precision: 0 } },
                },
            },
        } );
    }

    /* ── Clicks chart ───────────────────────────────────────────────────────── */
    var clicksCanvas = document.getElementById( 'chart-clicks' );
    if ( clicksCanvas && data.clicks && data.clicks.labels.length ) {
        new Chart( clicksCanvas, {
            type: 'line',
            data: {
                labels:   data.clicks.labels,
                datasets: [ {
                    label:           'Clicks',
                    data:            data.clicks.data,
                    borderColor:     '#008a20',
                    backgroundColor: 'rgba(0,138,32,.10)',
                    ...baseStyle,
                } ],
            },
            options: {
                responsive:          true,
                maintainAspectRatio: true,
                plugins: {
                    legend:  { display: false },
                    tooltip: tooltipStyle,
                },
                scales: {
                    x: { ...axisStyle, display: data.clicks.labels.length > 1 },
                    y: { ...axisStyle, beginAtZero: true, ticks: { ...axisStyle.ticks, precision: 0 } },
                },
            },
        } );
    }

} )();
