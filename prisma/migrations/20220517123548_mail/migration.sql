-- CreateTable
CREATE TABLE `client` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(80) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME NOT NULL,

    UNIQUE INDEX `client_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mail` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `from_email` VARCHAR(80) NOT NULL,
    `subject` VARCHAR(255) NULL,
    `body` LONGTEXT NULL,
    `text` TEXT NULL,
    `send_at` DATETIME NULL,
    `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `receiver` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `mail_id` INTEGER NULL,
    `to_email` VARCHAR(80) NOT NULL,
    `type` ENUM('1', '2', '3') NOT NULL DEFAULT '1',
    `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `file` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `mail_id` INTEGER NULL,
    `name` VARCHAR(255) NOT NULL,
    `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `receiver` ADD CONSTRAINT `receiver_mail_id_fkey` FOREIGN KEY (`mail_id`) REFERENCES `mail`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `file` ADD CONSTRAINT `file_mail_id_fkey` FOREIGN KEY (`mail_id`) REFERENCES `mail`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
