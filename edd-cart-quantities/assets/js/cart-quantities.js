/* global eddcq, jQuery */
(function ($) {
  'use strict';

  var EddCQ = {

    debounceTimer: null,

    init: function () {
      // Support both the classic table id and any fallback EDD cart wrapper.
      if (!$('#edd_checkout_cart, .edd_checkout_cart, [id*="edd_checkout_cart"]').length) return;
      this.inject();
      this.bind();
    },

    // ── Build quantity controls and append them to each cart row ──────────────

    inject: function () {
      // Match rows by ID prefix — reliable across all EDD versions regardless
      // of whether they carry the .edd_cart_item class or an explicit <tbody>.
      var $rows = $('tr[id^="edd_cart_item_"]');

      // Fallback: class-based match inside any EDD cart container.
      if (!$rows.length) {
        $rows = $('.edd_cart_item, tr.edd_cart_item, li.edd_cart_item');
      }

      $rows.each(function () {
        var $row    = $(this);
        var rowId   = $row.attr('id') || '';
        var cartKey = rowId.replace('edd_cart_item_', '');

        // If the ID didn't match the pattern, try a data attribute or bail.
        if (!cartKey || cartKey === rowId) {
          cartKey = $row.data('cart-key') || $row.data('key');
          if (!cartKey && cartKey !== 0) return;
        }

        if ($row.find('.eddcq-wrap').length) return; // already injected

        // Grab any qty already shown by EDD itself; default to 1.
        var currentQty = parseInt(
          $row.find('input[name*="quantity"], input[name*="qty"], .edd_cart_item_quantity').val() ||
          $row.find('.edd_cart_item_quantity').text(),
          10
        ) || 1;

        // Name cell: try multiple class names used across EDD versions/themes.
        var $nameCell = $row.find(
          '.edd_cart_item_name, .edd_item_name, .edd_cart_item_title, td:first-child'
        ).first();

        if (!$nameCell.length) return;

        $nameCell.append(
          '<div class="eddcq-wrap" data-cart-key="' + cartKey + '">' +
            '<button class="eddcq-btn eddcq-minus" type="button" aria-label="Decrease quantity">−</button>' +
            '<input class="eddcq-input" type="number" value="' + currentQty + '" min="1" max="999" aria-label="Quantity" />' +
            '<button class="eddcq-btn eddcq-plus"  type="button" aria-label="Increase quantity">+</button>' +
          '</div>'
        );
      });
    },

    // ── Event delegation (survives cart HTML replacement) ─────────────────────

    bind: function () {
      $(document)
        .on('click', '.eddcq-minus', function () {
          var $input = $(this).siblings('.eddcq-input');
          var val    = parseInt($input.val(), 10) || 1;
          if (val > 1) {
            $input.val(val - 1).trigger('eddcq:commit');
          }
        })
        .on('click', '.eddcq-plus', function () {
          var $input = $(this).siblings('.eddcq-input');
          var val    = parseInt($input.val(), 10) || 1;
          $input.val(val + 1).trigger('eddcq:commit');
        })
        .on('input', '.eddcq-input', function () {
          var $input = $(this);
          clearTimeout(EddCQ.debounceTimer);
          EddCQ.debounceTimer = setTimeout(function () {
            $input.trigger('eddcq:commit');
          }, 650);
        })
        .on('eddcq:commit', '.eddcq-input', function () {
          var $input   = $(this);
          var $wrap    = $input.closest('.eddcq-wrap');
          var cartKey  = $wrap.data('cart-key');
          var quantity = Math.max(1, parseInt($input.val(), 10) || 1);

          $input.val(quantity);

          EddCQ.update(cartKey, quantity, $input.closest('tr, li'));
        });
    },

    // ── AJAX update ───────────────────────────────────────────────────────────

    update: function (cartKey, quantity, $row) {
      $row.addClass('eddcq-loading');

      $.post(eddcq.ajaxUrl, {
        action:   'eddcq_update',
        nonce:    eddcq.nonce,
        cart_key: cartKey,
        quantity: quantity,
      })
      .done(function (response) {
        if (!response || !response.success) {
          $row.removeClass('eddcq-loading');
          return;
        }
        EddCQ.swapCart(response.data.cart_html);
        EddCQ.updateTotal(response.data.total);
      })
      .fail(function () {
        $row.removeClass('eddcq-loading');
      });
    },

    // ── Replace the cart table, then re-inject controls ───────────────────────

    swapCart: function (html) {
      if (!html) return;

      var $parsed   = $($.parseHTML(html));
      var $newTable = $parsed.filter('#edd_checkout_cart');
      if (!$newTable.length) $newTable = $parsed.find('#edd_checkout_cart');

      var $existing = $('#edd_checkout_cart');
      if ($newTable.length && $existing.length) {
        $existing.replaceWith($newTable);
      }

      EddCQ.inject();
    },

    // ── Update the grand total shown outside the cart table ───────────────────

    updateTotal: function (total) {
      if (!total) return;

      var selectors = [
        '#edd_final_total_wrap .edd_cart_amount',
        '.edd_cart_total .edd_cart_amount',
        '#edd_cart_total .edd_cart_amount',
        '.edd_cart_total_amount',
        '#edd_checkout_total_container',
        '[data-edd-total]',
      ];

      selectors.forEach(function (sel) {
        var $el = $(sel);
        if ($el.length) $el.text(total);
      });
    },
  };

  $(document).ready(function () {
    EddCQ.init();
  });

}(jQuery));


    // ── Event delegation (survives cart HTML replacement) ─────────────────────

    bind: function () {
      $(document)
        .on('click', '.eddcq-minus', function () {
          var $input = $(this).siblings('.eddcq-input');
          var val    = parseInt($input.val(), 10) || 1;
          if (val > 1) {
            $input.val(val - 1).trigger('eddcq:commit');
          }
        })
        .on('click', '.eddcq-plus', function () {
          var $input = $(this).siblings('.eddcq-input');
          var val    = parseInt($input.val(), 10) || 1;
          $input.val(val + 1).trigger('eddcq:commit');
        })
        .on('input', '.eddcq-input', function () {
          var $input = $(this);
          clearTimeout(EddCQ.debounceTimer);
          EddCQ.debounceTimer = setTimeout(function () {
            $input.trigger('eddcq:commit');
          }, 650);
        })
        .on('eddcq:commit', '.eddcq-input', function () {
          var $input   = $(this);
          var $wrap    = $input.closest('.eddcq-wrap');
          var cartKey  = $wrap.data('cart-key');
          var quantity = Math.max(1, parseInt($input.val(), 10) || 1);

          $input.val(quantity); // normalise display

          EddCQ.update(cartKey, quantity, $input.closest('tr'));
        });
    },

    // ── AJAX update ───────────────────────────────────────────────────────────

    update: function (cartKey, quantity, $row) {
      $row.addClass('eddcq-loading');

      $.post(eddcq.ajaxUrl, {
        action:   'eddcq_update',
        nonce:    eddcq.nonce,
        cart_key: cartKey,
        quantity: quantity,
      })
      .done(function (response) {
        if (!response || !response.success) return;

        EddCQ.swapCart(response.data.cart_html);
        EddCQ.updateTotal(response.data.total);
      })
      .fail(function () {
        $row.removeClass('eddcq-loading');
      });
    },

    // ── Replace the cart table, then re-inject controls ───────────────────────

    swapCart: function (html) {
      if (!html) return;

      // The response is the full <table id="edd_checkout_cart"> element.
      var $parsed = $($.parseHTML(html));
      var $newTable = $parsed.filter('#edd_checkout_cart');

      // Fallback: the table might be wrapped in something.
      if (!$newTable.length) {
        $newTable = $parsed.find('#edd_checkout_cart');
      }

      if ($newTable.length) {
        $('#edd_checkout_cart').replaceWith($newTable);
      }

      // Re-inject after swap (new DOM has no controls yet).
      EddCQ.inject();
    },

    // ── Update the grand total shown in the payment area ──────────────────────

    updateTotal: function (total) {
      if (!total) return;

      // EDD renders the final total in various containers depending on version.
      var selectors = [
        '#edd_final_total_wrap .edd_cart_amount',
        '.edd_cart_total .edd_cart_amount',
        '#edd_cart_total .edd_cart_amount',
        '.edd_cart_total_amount',
        '[data-edd-total]',
      ];

      selectors.forEach(function (sel) {
        var $el = $(sel);
        if ($el.length) $el.text(total);
      });
    },
  };

  $(document).ready(function () {
    EddCQ.init();
  });

}(jQuery));
