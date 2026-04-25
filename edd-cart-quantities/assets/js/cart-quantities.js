/* global eddcq */

jQuery(function ($) {
  'use strict';

  // ── Currency helpers ────────────────────────────────────────────────────────

  function formatPrice(amount) {
    var decimals  = parseInt(eddcq.decimals, 10) || 2;
    var decSep    = eddcq.decimalSep   || '.';
    var thouSep   = eddcq.thousandsSep || ',';
    var symbol    = eddcq.currencySymbol || '$';
    var pos       = eddcq.currencyPos    || 'before';

    var fixed  = parseFloat(amount).toFixed(decimals);
    var parts  = fixed.split('.');
    parts[0]   = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thouSep);
    var number = parts.join(decSep);

    return pos === 'before' ? symbol + number : number + symbol;
  }

  function parsePrice(str) {
    // Strip everything except digits and the first decimal point.
    var cleaned = String(str).replace(/[^0-9.]/g, '');
    // If the original string used a comma as decimal separator, handle that.
    if (eddcq.decimalSep === ',') {
      cleaned = String(str).replace(/[^0-9,]/g, '').replace(',', '.');
    }
    return parseFloat(cleaned) || 0;
  }

  // ── Main object ─────────────────────────────────────────────────────────────

  var EddCQ = {

    debounceTimer: null,

    init: function () {
      // Cart / checkout pages.
      if ($('#edd_checkout_cart, .edd_checkout_cart, #edd_cart_form').length) {
        this.injectCart();
      }
      // Download page (PHP renders .eddcq-dl-qty-wrap via hook).
      if ($('.eddcq-dl-qty-wrap').length) {
        this.injectDownload();
      }
      this.bind();
    },

    // ── Cart: inject +/− controls into each cart row ──────────────────────────

    injectCart: function () {
      var $rows = $('tr[id^="edd_cart_item_"]');
      if (!$rows.length) $rows = $('tr.edd_cart_item, li.edd_cart_item');

      $rows.each(function () {
        var $row    = $(this);
        var rowId   = $row.attr('id') || '';
        var cartKey = rowId.replace('edd_cart_item_', '');

        if (!cartKey || cartKey === rowId) {
          cartKey = $row.data('cart-key') || $row.data('key');
          if (cartKey === undefined || cartKey === '') return;
        }

        if ($row.find('.eddcq-wrap').length) return; // already injected

        var currentQty = parseInt(
          $row.find('input[name*="quantity"], input[name*="qty"]').val() ||
          $row.find('.edd_cart_item_quantity').text(),
          10
        ) || 1;

        // Read unit price from the existing price cell.
        var $priceCell = $row.find('.edd_cart_item_price, .edd_item_price').first();
        if (!$priceCell.length) $priceCell = $row.find('td').eq(1);
        var rawPrice  = parsePrice($priceCell.text());
        var unitPrice = currentQty > 1 ? rawPrice / currentQty : rawPrice;

        var $cell = $row.find(
          '.edd_cart_item_name, .edd_item_name, .edd_cart_item_title, td:first-child'
        ).first();
        if (!$cell.length) return;

        $cell.append(
          '<div class="eddcq-wrap"' +
            ' data-cart-key="'   + cartKey   + '"' +
            ' data-unit-price="' + unitPrice + '">' +
            '<button class="eddcq-btn eddcq-minus" type="button" aria-label="Decrease">&#8722;</button>' +
            '<input  class="eddcq-input" type="number" value="' + currentQty + '" min="1" max="999" aria-label="Quantity">' +
            '<button class="eddcq-btn eddcq-plus"  type="button" aria-label="Increase">+</button>' +
          '</div>'
        );

        // Cache the price cell on the row for quick lookup later.
        $row.data('eddcq-price-cell', $priceCell);
      });
    },

    // ── Download: the PHP hook renders the wrap; just store unit price ─────────

    injectDownload: function () {
      // Nothing to build — PHP already rendered the controls.
      // Bind is handled by the shared bind() below.
    },

    // ── Unified event delegation ───────────────────────────────────────────────

    bind: function () {
      $(document)
        .on('click', '.eddcq-minus', function () {
          var $input = $(this).closest('.eddcq-wrap').find('.eddcq-input');
          var val    = parseInt($input.val(), 10) || 1;
          if (val > 1) $input.val(val - 1).trigger('eddcq:commit');
        })
        .on('click', '.eddcq-plus', function () {
          var $input = $(this).closest('.eddcq-wrap').find('.eddcq-input');
          var val    = parseInt($input.val(), 10) || 1;
          $input.val(val + 1).trigger('eddcq:commit');
        })
        .on('input', '.eddcq-input', function () {
          var $input = $(this);
          clearTimeout(EddCQ.debounceTimer);
          EddCQ.debounceTimer = setTimeout(function () {
            $input.trigger('eddcq:commit');
          }, 600);
        })
        .on('eddcq:commit', '.eddcq-input', function () {
          var $input    = $(this);
          var $wrap     = $input.closest('.eddcq-wrap');
          var cartKey   = $wrap.data('cart-key');
          var unitPrice = parseFloat($wrap.data('unit-price')) || 0;
          var quantity  = Math.max(1, parseInt($input.val(), 10) || 1);
          $input.val(quantity);

          // Skip AJAX on download page (no cart key).
          if (!cartKey && cartKey !== 0) return;

          // 1. Instant client-side price cell update.
          var $row       = $wrap.closest('tr, li');
          var $priceCell = $row.data('eddcq-price-cell');
          if (!$priceCell || !$priceCell.length) {
            $priceCell = $row.find('.edd_cart_item_price, .edd_item_price').first();
            if (!$priceCell.length) $priceCell = $row.find('td').eq(1);
          }
          if (unitPrice > 0) {
            $priceCell.text(formatPrice(unitPrice * quantity));
          }

          // 2. Persist to server, refresh subtotal + total.
          EddCQ.sync(cartKey, quantity, $row);
        });
    },

    // ── AJAX ──────────────────────────────────────────────────────────────────

    sync: function (cartKey, quantity, $row) {
      $row.addClass('eddcq-loading');

      $.post(eddcq.ajaxUrl, {
        action:   'eddcq_update',
        nonce:    eddcq.nonce,
        cart_key: cartKey,
        quantity: quantity,
      })
      .done(function (response) {
        if (!response || !response.success) return;
        var d = response.data;

        if (d.subtotal) {
          $('.edd_cart_subtotal_amount, .edd_subtotal_amount').text(d.subtotal);
        }
        if (d.total) {
          $(
            '#edd_final_total_wrap .edd_cart_amount,' +
            '.edd_cart_total .edd_cart_amount,' +
            '#edd_cart_total .edd_cart_amount,' +
            '.edd_cart_total_amount,' +
            '#edd_checkout_total_container,' +
            '[data-edd-total]'
          ).text(d.total);
        }
      })
      .always(function () {
        $row.removeClass('eddcq-loading');
      });
    },
  };

  EddCQ.init();
});
