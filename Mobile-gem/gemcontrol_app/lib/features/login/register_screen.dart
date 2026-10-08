import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../core/api/api_client.dart';
import '../../core/repositories/auth_repository.dart';
import '../../core/theme/app_theme.dart';
import '../../shared/forms/validators.dart';
import '../../shared/widgets/app_toast.dart';

/// Self-signup: creates a brand-new shop (Firm) and its admin account
/// together in one step, mirroring the web app's "Set Up Your Shop" page --
/// same public /register endpoint, same two field groups (personal + shop).
class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _contactCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  final _firmNameCtrl = TextEditingController();
  final _firmLocationCtrl = TextEditingController();
  final _firmSizeCtrl = TextEditingController();
  bool _obscure = true;
  bool _submitting = false;
  String? _error;

  @override
  void dispose() {
    _nameCtrl.dispose();
    _emailCtrl.dispose();
    _contactCtrl.dispose();
    _passwordCtrl.dispose();
    _firmNameCtrl.dispose();
    _firmLocationCtrl.dispose();
    _firmSizeCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _submitting = true;
      _error = null;
    });
    try {
      await ref.read(authRepositoryProvider).registerShop(
            name: _nameCtrl.text.trim(),
            email: _emailCtrl.text.trim(),
            contact: _contactCtrl.text.trim(),
            password: _passwordCtrl.text,
            firmName: _firmNameCtrl.text.trim(),
            firmLocation: _firmLocationCtrl.text.trim(),
            firmSize: _firmSizeCtrl.text.trim(),
          );
      if (!mounted) return;
      AppToast.show(context, 'Shop created — please log in.', type: AppToastType.success);
      context.go('/login');
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } catch (_) {
      setState(() => _error = 'Could not reach the server. Check your connection and try again.');
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      appBar: AppBar(
        backgroundColor: theme.scaffoldBackgroundColor,
        elevation: 0,
      ),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 28),
            child: Form(
              key: _formKey,
              autovalidateMode: AutovalidateMode.onUserInteraction,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Center(
                    child: Text(
                      'Set Up Your Shop',
                      style: GoogleFonts.openSans(fontSize: 26, fontWeight: FontWeight.w700),
                      textAlign: TextAlign.center,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Center(
                    child: Text(
                      'Create your account and your shop together',
                      style: TextStyle(color: scheme.onSurfaceVariant),
                      textAlign: TextAlign.center,
                    ),
                  ),
                  const SizedBox(height: 28),
                  Text(
                    'Your account',
                    style: TextStyle(fontWeight: FontWeight.w600, color: scheme.onSurfaceVariant),
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _nameCtrl,
                    textCapitalization: TextCapitalization.words,
                    inputFormatters: lengthLimit(kNameMax),
                    decoration: const InputDecoration(labelText: 'Name'),
                    validator: (v) => nameRule(v ?? '', label: 'Name'),
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _emailCtrl,
                    keyboardType: TextInputType.emailAddress,
                    inputFormatters: lengthLimit(kEmailMax),
                    decoration: const InputDecoration(labelText: 'Email'),
                    validator: (v) => emailRule(v ?? ''),
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _contactCtrl,
                    keyboardType: TextInputType.phone,
                    inputFormatters: phoneFormatters,
                    decoration: const InputDecoration(
                      labelText: 'Contact',
                      helperText: '10 digit mobile number',
                    ),
                    validator: (v) => phoneRule(v ?? '', label: 'Contact'),
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _passwordCtrl,
                    obscureText: _obscure,
                    inputFormatters: lengthLimit(kPasswordMax),
                    decoration: InputDecoration(
                      labelText: 'Password',
                      suffixIcon: IconButton(
                        icon: Icon(
                          _obscure ? Icons.visibility_outlined : Icons.visibility_off_outlined,
                        ),
                        onPressed: () => setState(() => _obscure = !_obscure),
                      ),
                    ),
                    validator: (v) => passwordRule(v ?? ''),
                  ),
                  const SizedBox(height: 24),
                  Divider(color: theme.extension<AppColorsExtension>()?.hairline),
                  const SizedBox(height: 8),
                  Text(
                    'Your shop',
                    style: TextStyle(fontWeight: FontWeight.w600, color: scheme.onSurfaceVariant),
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _firmNameCtrl,
                    textCapitalization: TextCapitalization.words,
                    inputFormatters: lengthLimit(kNameMax),
                    decoration: const InputDecoration(labelText: 'Shop Name'),
                    validator: (v) => nameRule(v ?? '', label: 'Shop name'),
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _firmLocationCtrl,
                    inputFormatters: lengthLimit(kAddressMax),
                    decoration: const InputDecoration(labelText: 'Shop Location'),
                    validator: (v) => textRule(v ?? '', 'Shop location', max: kAddressMax),
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _firmSizeCtrl,
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    inputFormatters: decimalFormatters(decimals: 2, maxLength: 9),
                    decoration: const InputDecoration(labelText: 'Shop Size (sq. ft.)'),
                    validator: (v) => positiveNumberRule(v ?? '', 'Shop size', max: 10000000),
                  ),
                  if (_error != null) ...[
                    const SizedBox(height: 12),
                    Text(
                      _error!,
                      style: TextStyle(color: scheme.error, fontSize: 13),
                      textAlign: TextAlign.center,
                    ),
                  ],
                  const SizedBox(height: 24),
                  ElevatedButton(
                    onPressed: _submitting ? null : _submit,
                    child: _submitting
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                          )
                        : const Text('Sign Up'),
                  ),
                  const SizedBox(height: AppSpacing.md),
                  Center(
                    child: TextButton(
                      onPressed: () => context.go('/login'),
                      child: const Text('Already have an account? Log in'),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
