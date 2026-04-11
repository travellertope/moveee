/**
 * Culture Community - Analytics Dashboard Charts
 *
 * Renders Chart.js bar charts for attendance and member growth.
 * Data is passed via wp_localize_script as `cultureAnalytics`.
 */
(function() {
    'use strict';

    document.addEventListener('DOMContentLoaded', function() {
        if (typeof Chart === 'undefined' || typeof cultureAnalytics === 'undefined') {
            return;
        }

        var primaryColor = '#2c3e50';
        var accentColor = '#e67e22';
        var successColor = '#27ae60';

        // Attendance chart.
        var attendanceCtx = document.getElementById('culture-attendance-chart');
        if (attendanceCtx) {
            var attendanceData = cultureAnalytics.attendance || [];
            new Chart(attendanceCtx.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: attendanceData.map(function(d) { return d.month; }),
                    datasets: [{
                        label: cultureAnalytics.labels.checkins,
                        data: attendanceData.map(function(d) { return d.count; }),
                        backgroundColor: accentColor + 'CC',
                        borderColor: accentColor,
                        borderWidth: 1,
                        borderRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: { precision: 0 }
                        }
                    }
                }
            });
        }

        // Members chart.
        var membersCtx = document.getElementById('culture-members-chart');
        if (membersCtx) {
            var membersData = cultureAnalytics.members || [];
            new Chart(membersCtx.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: membersData.map(function(d) { return d.month; }),
                    datasets: [{
                        label: cultureAnalytics.labels.new_members,
                        data: membersData.map(function(d) { return d.count; }),
                        backgroundColor: successColor + 'CC',
                        borderColor: successColor,
                        borderWidth: 1,
                        borderRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: { precision: 0 }
                        }
                    }
                }
            });
        }
    });
})();
