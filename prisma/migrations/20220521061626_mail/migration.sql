/*
  Warnings:

  - You are about to alter the column `created_at` on the `client` table. The data in that column could be lost. The data in that column will be cast from `DateTime(0)` to `DateTime`.
  - You are about to alter the column `updated_at` on the `client` table. The data in that column could be lost. The data in that column will be cast from `DateTime(0)` to `DateTime`.
  - You are about to alter the column `created_at` on the `file` table. The data in that column could be lost. The data in that column will be cast from `DateTime(0)` to `DateTime`.
  - You are about to alter the column `updated_at` on the `file` table. The data in that column could be lost. The data in that column will be cast from `DateTime(0)` to `DateTime`.
  - You are about to alter the column `send_at` on the `mail` table. The data in that column could be lost. The data in that column will be cast from `DateTime(0)` to `DateTime`.
  - You are about to alter the column `created_at` on the `mail` table. The data in that column could be lost. The data in that column will be cast from `DateTime(0)` to `DateTime`.
  - You are about to alter the column `updated_at` on the `mail` table. The data in that column could be lost. The data in that column will be cast from `DateTime(0)` to `DateTime`.
  - You are about to alter the column `created_at` on the `receiver` table. The data in that column could be lost. The data in that column will be cast from `DateTime(0)` to `DateTime`.
  - You are about to alter the column `updated_at` on the `receiver` table. The data in that column could be lost. The data in that column will be cast from `DateTime(0)` to `DateTime`.

*/
-- AlterTable
ALTER TABLE `client` MODIFY `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    MODIFY `updated_at` DATETIME NOT NULL;

-- AlterTable
ALTER TABLE `file` MODIFY `name` VARCHAR(255) NULL,
    MODIFY `title` VARCHAR(255) NULL,
    MODIFY `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP(3),
    MODIFY `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP(3);

-- AlterTable
ALTER TABLE `mail` MODIFY `send_at` DATETIME NULL,
    MODIFY `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP(3),
    MODIFY `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP(3);

-- AlterTable
ALTER TABLE `receiver` MODIFY `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP(3),
    MODIFY `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP(3);
