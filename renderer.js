// Shipped Products renderer (frozen spec FR-7): fetches products.json,
// renders one entry per product, newest-first by shipped_at (ties break
// alphabetically by name). The FR-5 empty state is the default HTML and
// is replaced only when at least one valid product renders.
(function () {
  'use strict';

  var ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
  var HTTPS_URL = /^https:\/\//;

  fetch('products.json')
    .then(function (res) {
      if (!res.ok) throw new Error('products.json ' + res.status);
      return res.json();
    })
    .then(function (data) {
      var products = (data && data.products) || [];
      var valid = products.filter(function (p) {
        return p && typeof p.name === 'string' && p.name &&
          typeof p.description === 'string' && p.description.length <= 140 &&
          typeof p.shipped_at === 'string' && ISO_DATE.test(p.shipped_at);
      });
      if (valid.length === 0) return;
      valid.sort(function (a, b) {
        if (a.shipped_at !== b.shipped_at) return a.shipped_at < b.shipped_at ? 1 : -1;
        return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
      });
      var host = document.getElementById('products');
      host.textContent = '';
      valid.forEach(function (p) {
        var entry = document.createElement('article');
        entry.className = 'product';
        var name = document.createElement('p');
        name.className = 'product-name';
        if (typeof p.url === 'string' && HTTPS_URL.test(p.url)) {
          var a = document.createElement('a');
          a.href = p.url;
          a.textContent = p.name;
          name.appendChild(a);
        } else {
          name.textContent = p.name;
        }
        var description = document.createElement('p');
        description.className = 'product-description';
        description.textContent = p.description;
        var date = document.createElement('p');
        date.className = 'product-shipped-at';
        date.textContent = new Date(p.shipped_at + 'T00:00:00Z').toLocaleDateString('en-US', {
          year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC'
        });
        entry.appendChild(name);
        entry.appendChild(description);
        entry.appendChild(date);
        host.appendChild(entry);
      });
    })
    .catch(function () {
      /* Empty state (FR-5) remains the honest default. */
    });
})();
