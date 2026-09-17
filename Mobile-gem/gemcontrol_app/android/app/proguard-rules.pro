# Project-specific R8 / ProGuard rules for the release build.
#
# The Flutter Gradle plugin already applies its own rules
# (flutter_proguard_rules.pro) plus each plugin's consumer rules. Add app- or
# plugin-specific keeps below only when release testing shows something being
# stripped.

# --- Flutter / platform channels -------------------------------------------------
-keep class io.flutter.embedding.** { *; }
-keep class io.flutter.plugin.** { *; }
-keep class io.flutter.plugins.** { *; }

# --- Kotlin metadata / coroutines --------------------------------------------
-keepclassmembers class kotlin.Metadata { *; }
-dontwarn kotlin.**
-dontwarn org.jetbrains.annotations.**

# --- Keep annotations and generated Pigeon messengers used by plugins -----------
-keepattributes *Annotation*, Signature, InnerClasses, EnclosingMethod

# --- Suppress warnings for optional desugar / build-time-only classes ----------
-dontwarn javax.annotation.**
-dontwarn com.google.errorprone.annotations.**

# --- Google Play Core (deferred components / Play Feature Delivery) -------------
# Flutter's embedding references these classes for split installs. This app does
# not use deferred components, so the library isn't on the classpath — tell R8
# the references are fine to leave unresolved.
-dontwarn com.google.android.play.core.**
-keep class io.flutter.embedding.engine.deferredcomponents.** { *; }
-keep class io.flutter.embedding.android.FlutterPlayStoreSplitApplication { *; }
