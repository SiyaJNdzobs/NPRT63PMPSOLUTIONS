import 'package:firebase_storage/firebase_storage.dart';

/// Handles Excel file upload (owners / taxis bulk import) and
/// triggers the processExcelImport Cloud Function.
///
/// TODO:
///   - pickExcelFile() → picks .xlsx from device storage
///   - uploadToStorage(file) → uploads to Firebase Storage, returns download URL
///   - triggerImport(storageRef) → calls FunctionsService.processExcelImport
///   - streamImportProgress() → listens to Firestore for import job status
class ExcelImportService {
  ExcelImportService._();
  static final ExcelImportService instance = ExcelImportService._();

  // TODO: implement
}
