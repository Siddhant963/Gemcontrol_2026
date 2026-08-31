/// Central API endpoint configuration for the GemControl mobile app.
///
/// Pick the backend in one of two ways:
///
/// 1. Flip [_useProductionByDefault] below (true = hosted, false = local).
/// 2. Override per build/run without touching code:
///      flutter run --dart-define=USE_PRODUCTION=false
///      flutter run --dart-define=API_BASE_URL=http://192.168.1.20:5000/api/admin \
///                  --dart-define=UPLOADS_BASE_URL=http://192.168.1.20:5000
///
/// An explicit API_BASE_URL / UPLOADS_BASE_URL always wins; otherwise the
/// production flag decides which of the URL pairs below is used.
class ApiConfig {
  ApiConfig._();

  // ---------------------------------------------------------------------------
  // The switch
  // ---------------------------------------------------------------------------

  /// Default target when no `--dart-define=USE_PRODUCTION=...` is passed.
  ///   true  -> hosted Render backend (release / QA builds)
  ///   false -> local backend on your machine (day-to-day development)
  static const bool _useProductionByDefault = true;

  /// Effective flag: `--dart-define=USE_PRODUCTION=true|false` overrides the
  /// hard-coded default above.
  static const bool useProduction = bool.fromEnvironment(
    'USE_PRODUCTION',
    defaultValue: _useProductionByDefault,
  );

  // ---------------------------------------------------------------------------
  // Environments
  // ---------------------------------------------------------------------------

  /// Hosted backend — same Render deployment + MongoDB the web app's
  /// production build uses (see Frontend-gem/GemControl/.env.production).
  static const String _prodApiBaseUrl =
      'https://gemcontrol-2026.onrender.com/api/admin';
  static const String _prodUploadsBaseUrl =
      'https://gemcontrol-2026.onrender.com';

  /// Local backend. `10.0.2.2` is the Android emulator's alias for the host
  /// machine's `localhost`. On a physical device, override with your machine's
  /// LAN IP via `--dart-define=API_BASE_URL=...`.
  static const String _localApiBaseUrl = 'http://10.0.2.2:5000/api/admin';
  static const String _localUploadsBaseUrl = 'http://10.0.2.2:5000';

  // ---------------------------------------------------------------------------
  // Resolved values (used by ApiClient)
  // ---------------------------------------------------------------------------

  /// Base URL for every `/api/admin/*` request.
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: useProduction ? _prodApiBaseUrl : _localApiBaseUrl,
  );

  /// Root used to turn a relative `Uploads/...` path from the API into a full
  /// image URL.
  static const String uploadsBaseUrl = String.fromEnvironment(
    'UPLOADS_BASE_URL',
    defaultValue: useProduction ? _prodUploadsBaseUrl : _localUploadsBaseUrl,
  );

  /// True when the app is actually pointed at the hosted backend (accounts for
  /// an explicit API_BASE_URL override, not just the flag).
  static bool get isProduction => apiBaseUrl == _prodApiBaseUrl;

  /// One-line summary for debug banners / logs.
  static String get describe =>
      '${isProduction ? 'PRODUCTION' : 'LOCAL'} · $apiBaseUrl';
}
