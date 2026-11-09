// Prompt box on the "can X make music" posts. The form works without this file
// (a plain GET to /create); this adds the blog_cta_click event before leaving.
// The other half, create_from_blog, is sent from the create form.
(function () {
  var leaving = false;

  function submit(form) {
    if (leaving) return;
    leaving = true;

    var slug = form.elements.from.value;
    var prompt = form.elements.prompt.value.trim();
    var params = new URLSearchParams({ from: slug });
    if (prompt) params.set('prompt', prompt);
    var url = '/create?' + params.toString();

    var left = false;
    function go() {
      if (left) return;
      left = true;
      window.location.href = url;
    }

    // Only the length: what people type stays out of analytics.
    if (typeof gtag === 'function') {
      gtag('event', 'blog_cta_click', {
        post_slug: slug,
        cta_position: form.dataset.position,
        has_prompt: Boolean(prompt),
        prompt_length: prompt.length,
        transport_type: 'beacon',
        event_callback: go,
        event_timeout: 600
      });
    }
    // gtag.js may be blocked, and then event_callback never runs.
    setTimeout(go, 700);
  }

  document.querySelectorAll('form.blog-cta').forEach(function (form) {
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      submit(form);
    });
    form.elements.prompt.addEventListener('keydown', function (event) {
      if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
        event.preventDefault();
        submit(form);
      }
    });
  });

  // Coming back from /create restores this page from the back/forward cache.
  window.addEventListener('pageshow', function () {
    leaving = false;
  });
})();
