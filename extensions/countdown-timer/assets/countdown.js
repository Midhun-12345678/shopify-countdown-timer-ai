(function () {
  try {
    var root = document.getElementById("countdown-timer-root");
    if (!root) return;

    var productId = root.dataset.productId;
    if (!productId) return;

    function formatRemaining(ms) {
      var totalSeconds = Math.floor(ms / 1000);
      var seconds = totalSeconds % 60;
      var totalMinutes = (totalSeconds - seconds) / 60;
      var minutes = totalMinutes % 60;
      var hours = (totalMinutes - minutes) / 60;

      function pad(n) {
        return n < 10 ? "0" + n : String(n);
      }

      return pad(hours) + "h " + pad(minutes) + "m " + pad(seconds) + "s";
    }

    function trackImpression(timerId) {
      try {
        if (!timerId) return;
        var url = "/api/timers/" + encodeURIComponent(timerId) + "/impression";
        fetch(url, { method: "POST" }).catch(function () {
          // ignore errors – analytics should never break page
        });
      } catch (e) {
        // swallow any unexpected errors
      }
    }

    function renderCountdown(endTime, opts) {
      var options = opts || {};

      function update() {
        try {
          var now = Date.now();
          var diff = endTime - now;

          if (diff <= 0) {
            root.style.display = "none";
            clearInterval(intervalId);

            // For evergreen timers, clear stored expiry when finished
            if (options.storageKey && window.localStorage) {
              try {
                window.localStorage.removeItem(options.storageKey);
              } catch (e) {
                // ignore
              }
            }

            return;
          }

          root.textContent = "🔥 Offer ends in: " + formatRemaining(diff);
        } catch (e) {
          clearInterval(intervalId);
        }
      }

      update();
      var intervalId = setInterval(update, 1000);
    }

    function fetchActiveTimer() {
      var url = "/api/timers/active?productId=" + encodeURIComponent(productId);

      fetch(url, { method: "GET" })
        .then(function (response) {
          if (response.status === 204) {
            return null;
          }
          if (!response.ok) {
            return null;
          }
          return response.json();
        })
        .then(function (timer) {
          if (!timer) {
            return;
          }

          var type = timer.type || "fixed";

          // Evergreen timers: per-visitor expiry via localStorage
          if (type === "evergreen") {
            if (!timer.id || !timer.durationMinutes) {
              return;
            }

            var storageKey = "evergreen_timer_" + String(timer.id);
            var expiryMs = null;

            try {
              if (window.localStorage) {
                var stored = window.localStorage.getItem(storageKey);
                if (stored) {
                  var parsed = parseInt(stored, 10);
                  if (!isNaN(parsed) && parsed > Date.now()) {
                    expiryMs = parsed;
                  }
                }
              }
            } catch (e) {
              // ignore localStorage errors
            }

            if (!expiryMs) {
              var durationMs = Number(timer.durationMinutes) * 60 * 1000;
              if (!durationMs || isNaN(durationMs) || durationMs <= 0) {
                return;
              }
              expiryMs = Date.now() + durationMs;

              try {
                if (window.localStorage) {
                  window.localStorage.setItem(
                    storageKey,
                    String(expiryMs)
                  );
                }
              } catch (e) {
                // ignore
              }
            }

              // Count one impression per page load once we know the timer is valid
              trackImpression(timer.id);

              renderCountdown(expiryMs, { storageKey: storageKey });
            return;
          }

          // Fixed timers: use server-provided endAt as before
          if (!timer.endAt) {
            return;
          }

          var endTime = new Date(timer.endAt).getTime();
          if (!endTime || isNaN(endTime)) {
            return;
          }

          // Fixed timers: track impressions once per page load
          trackImpression(timer.id);

          renderCountdown(endTime);
        })
        .catch(function () {
          // fail silently – never break storefront
        });
    }

    fetchActiveTimer();
  } catch (e) {
    // final safety: never throw to storefront
  }
})();
