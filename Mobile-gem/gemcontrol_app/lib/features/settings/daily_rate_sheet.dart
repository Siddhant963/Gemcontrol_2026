import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/models/daily_rate.dart';
import '../../core/repositories/daily_rate_repository.dart';
import '../../core/theme/app_theme.dart';
import '../dashboard/dashboard_providers.dart';
import '../../shared/forms/live_validation.dart';
import '../../shared/forms/validators.dart';
import '../../shared/widgets/app_toast.dart';
import '../../shared/widgets/form_error_banner.dart';

class DailyRateSheet extends ConsumerStatefulWidget {
  final DailyRate? existing;
  const DailyRateSheet({super.key, this.existing});

  @override
  ConsumerState<DailyRateSheet> createState() => _DailyRateSheetState();
}

class _DailyRateSheetState extends ConsumerState<DailyRateSheet> {
  final _goldCtrl = TextEditingController(text: '0');
  final _silverCtrl = TextEditingController(text: '0');
  final _d05Ctrl = TextEditingController(text: '0');
  final _d1Ctrl = TextEditingController(text: '0');
  final _d15Ctrl = TextEditingController(text: '0');
  final _d2Ctrl = TextEditingController(text: '0');
  final _d25Ctrl = TextEditingController(text: '0');
  final _d3Ctrl = TextEditingController(text: '0');
  bool _saving = false;

  late final LiveValidation _v = LiveValidation(_rules, () {
    if (mounted) setState(() {});
  });

  late final Map<String, TextEditingController> _fields = {
    'gold': _goldCtrl,
    'silver': _silverCtrl,
    'd05': _d05Ctrl,
    'd1': _d1Ctrl,
    'd15': _d15Ctrl,
    'd2': _d2Ctrl,
    'd25': _d25Ctrl,
    'd3': _d3Ctrl,
  };

  // gold + silver are the rates the dashboard shows, so they must be > 0;
  // the per-carat diamond rates may stay 0.
  Map<String, String> _rules() => errorsOf({
    'gold': positiveNumberRule(_goldCtrl.text, 'Gold rate', max: 10000000),
    'silver': positiveNumberRule(_silverCtrl.text, 'Silver rate', max: 10000000),
    for (final k in ['d05', 'd1', 'd15', 'd2', 'd25', 'd3'])
      k: nonNegativeNumberRule(_fields[k]!.text, 'Rate', max: 1000000000),
  });

  Widget _rateField(String key, String label) => _v.wrap(
    key,
    TextField(
      controller: _fields[key],
      keyboardType: const TextInputType.numberWithOptions(decimal: true),
      inputFormatters: decimalFormatters(decimals: 2, maxLength: 12),
      onChanged: (_) => _v.changed(),
      decoration: InputDecoration(labelText: label, errorText: _v.errorFor(key), errorMaxLines: 2),
    ),
  );

  @override
  void dispose() {
    for (final c in _fields.values) {
      c.dispose();
    }
    super.dispose();
  }

  @override
  void initState() {
    super.initState();
    final r = widget.existing;
    if (r != null) {
      _goldCtrl.text = r.gold.k24.toString();
      _silverCtrl.text = r.silver.toString();
      _d05Ctrl.text = r.diamond.c0_5.toString();
      _d1Ctrl.text = r.diamond.c1.toString();
      _d15Ctrl.text = r.diamond.c1_5.toString();
      _d2Ctrl.text = r.diamond.c2.toString();
      _d25Ctrl.text = r.diamond.c2_5.toString();
      _d3Ctrl.text = r.diamond.c3.toString();
    }
  }

  double _n(TextEditingController c) => double.tryParse(c.text) ?? 0;

  Future<void> _save() async {
    if (!_v.validateAll()) {
      AppToast.show(context, 'Please fix the highlighted fields.', type: AppToastType.warning);
      return;
    }
    setState(() => _saving = true);
    final diamond = {
      '0_5 Carat': _n(_d05Ctrl),
      '1 Carat': _n(_d1Ctrl),
      '1_5 Carat': _n(_d15Ctrl),
      '2 Carat': _n(_d2Ctrl),
      '2_5 Carat': _n(_d25Ctrl),
      '3 Carat': _n(_d3Ctrl),
    };
    try {
      final repo = ref.read(dailyRateRepositoryProvider);
      if (widget.existing != null) {
        await repo.updateRate(
          id: widget.existing!.id,
          date: DateTime.now(),
          gold24k: _n(_goldCtrl),
          silver: _n(_silverCtrl),
          diamond: diamond,
        );
      } else {
        await repo.createRate(
          date: DateTime.now(),
          gold24k: _n(_goldCtrl),
          silver: _n(_silverCtrl),
          diamond: diamond,
        );
      }
      ref.invalidate(dashboardDataProvider);
      if (mounted) Navigator.pop(context);
    } catch (e) {
      if (mounted) {
        AppToast.show(context, _v.describeError(e), type: AppToastType.error);
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return SingleChildScrollView(
      padding: EdgeInsets.only(
        left: AppSpacing.lg,
        right: AppSpacing.lg,
        top: AppSpacing.lg,
        bottom: MediaQuery.of(context).viewInsets.bottom + AppSpacing.lg,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text("Today's Rate", style: Theme.of(context).textTheme.headlineSmall),
          Text(
            'Enter 24K gold + silver — other karats are auto-derived.',
            style: TextStyle(fontSize: 12, color: scheme.onSurfaceVariant),
          ),
          const SizedBox(height: AppSpacing.md),
          FormErrorBanner(_v.formError),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(child: _rateField('gold', 'Gold 24K (₹/g)')),
              const SizedBox(width: AppSpacing.sm),
              Expanded(child: _rateField('silver', 'Silver (₹/g)')),
            ],
          ),
          const SizedBox(height: AppSpacing.md),
          Text('Diamond rate by carat (₹)', style: Theme.of(context).textTheme.labelMedium),
          const SizedBox(height: AppSpacing.sm),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(child: _rateField('d05', '0.5 ct')),
              const SizedBox(width: 8),
              Expanded(child: _rateField('d1', '1 ct')),
              const SizedBox(width: 8),
              Expanded(child: _rateField('d15', '1.5 ct')),
            ],
          ),
          const SizedBox(height: AppSpacing.sm),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(child: _rateField('d2', '2 ct')),
              const SizedBox(width: 8),
              Expanded(child: _rateField('d25', '2.5 ct')),
              const SizedBox(width: 8),
              Expanded(child: _rateField('d3', '3 ct')),
            ],
          ),
          const SizedBox(height: AppSpacing.lg),
          ElevatedButton(
            onPressed: _saving ? null : _save,
            child: _saving
                ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                : const Text('Save Rate'),
          ),
        ],
      ),
    );
  }
}
