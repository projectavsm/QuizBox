-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Settings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "examTitle" TEXT NOT NULL DEFAULT 'QuizBox Examination',
    "durationMinutes" INTEGER NOT NULL DEFAULT 30,
    "isExamActive" BOOLEAN NOT NULL DEFAULT true
);
INSERT INTO "new_Settings" ("durationMinutes", "examTitle", "id", "isExamActive") SELECT "durationMinutes", "examTitle", "id", "isExamActive" FROM "Settings";
DROP TABLE "Settings";
ALTER TABLE "new_Settings" RENAME TO "Settings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
