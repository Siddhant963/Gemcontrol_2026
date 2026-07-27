import 'dart:io';

import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:path_provider/path_provider.dart';

import '../api/api_client.dart';

class ExportRepository {
  final ApiClient _client;
  ExportRepository(this._client);

  /// Downloads the admin data export (.xlsx) and saves it into the app's
  /// documents directory (the export endpoint is Bearer-token gated, so a
  /// plain external-browser link won't carry auth — this does the
  /// authenticated request in-app instead).
  Future<File> downloadExport() async {
    try {
      final response = await _client.dio.get<List<int>>(
        '/exportAllDataToExcel',
        options: Options(responseType: ResponseType.bytes),
      );
      final dir = await getApplicationDocumentsDirectory();
      final fileName = 'GemControl_Export_${DateTime.now().millisecondsSinceEpoch}.xlsx';
      final file = File('${dir.path}/$fileName');
      await file.writeAsBytes(response.data!);
      return file;
    } on DioException catch (e) {
      throw ApiException(e.message ?? 'Export failed', statusCode: e.response?.statusCode);
    }
  }
}

final exportRepositoryProvider = Provider<ExportRepository>((ref) {
  return ExportRepository(ref.watch(apiClientProvider));
});
