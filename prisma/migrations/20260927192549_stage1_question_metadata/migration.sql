-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Question" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "questionText" TEXT NOT NULL,
    "optionA" TEXT NOT NULL,
    "optionB" TEXT NOT NULL,
    "optionC" TEXT NOT NULL,
    "optionD" TEXT NOT NULL,
    "correctOption" TEXT NOT NULL,
    "subject" TEXT NOT NULL DEFAULT 'General',
    "gradeClass" TEXT NOT NULL DEFAULT 'All',
    "difficulty" TEXT NOT NULL DEFAULT 'Medium',
    "marks" REAL NOT NULL DEFAULT 1.0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Question" ("correctOption", "createdAt", "id", "optionA", "optionB", "optionC", "optionD", "questionText") SELECT "correctOption", "createdAt", "id", "optionA", "optionB", "optionC", "optionD", "questionText" FROM "Question";
DROP TABLE "Question";
ALTER TABLE "new_Question" RENAME TO "Question";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
