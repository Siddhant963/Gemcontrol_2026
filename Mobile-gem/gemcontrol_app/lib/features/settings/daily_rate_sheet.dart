import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/api/api_client.dart';
import '../../core/models/daily_rate.dart';
import '../../core/repositories/daily_rate_repository.dart';
import '../../core/theme/app_theme.dart';
import '../dashboard/dashboard_providers.dart';

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
    } on ApiException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
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
          const Text(
            'Enter 24K gold + silver — other karats are auto-derived.',
            style: TextStyle(fontSize: 12, color: AppColors.onSurfaceVariant),
          ),
          const SizedBox(height: AppSpacing.md),
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _goldCtrl,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(labelText: 'Gold 24K (₹/g)'),
                ),
              ),
              const SizedBox(width: AppSpacing.sm),
              Expanded(
                child: TextField(
                  controller: _silverCtrl,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(labelText: 'Silver (₹/g)'),
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.md),
          Text('Diamond rate by carat (₹)', style: Theme.of(context).textTheme.labelMedium),
          const SizedBox(height: AppSpacing.sm),
          Row(
            children: [
              Expanded(child: TextField(controller: _d05Ctrl, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: '0.5 ct'))),
              const SizedBox(width: 8),
              Expanded(child: TextField(controller: _d1Ctrl, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: '1 ct'))),
              const SizedBox(width: 8),
              Expanded(child: TextField(controller: _d15Ctrl, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: '1.5 ct'))),
            ],
          ),
          const SizedBox(height: AppSpacing.sm),
          Row(
            children: [
              Expanded(child: TextField(controller: _d2Ctrl, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: '2 ct'))),
              const SizedBox(width: 8),
              Expanded(child: TextField(controller: _d25Ctrl, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: '2.5 ct'))),
              const SizedBox(width: 8),
              Expanded(child: TextField(controller: _d3Ctrl, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: '3 ct'))),
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
