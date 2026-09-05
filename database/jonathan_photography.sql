-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: 127.0.0.1    Database: jonathan_photography
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `admins`
--

DROP TABLE IF EXISTS `admins`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `admins` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `username` varchar(60) NOT NULL,
  `email` varchar(160) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admins`
--

LOCK TABLES `admins` WRITE;
/*!40000 ALTER TABLE `admins` DISABLE KEYS */;
INSERT INTO `admins` VALUES (1,'admin','mereziko@gmail.com','$2b$10$pQilqgGxmNxOSdsUTmAiTOUHHYidu6JvacMg.FUWwkLm8C/IG8wIi','2026-08-26 17:01:19','2026-08-26 17:01:19');
/*!40000 ALTER TABLE `admins` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `booking_addons`
--

DROP TABLE IF EXISTS `booking_addons`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `booking_addons` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `booking_id` int(10) unsigned NOT NULL,
  `label` varchar(120) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_booking_addon_booking` (`booking_id`),
  CONSTRAINT `fk_booking_addon_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `booking_addons`
--

LOCK TABLES `booking_addons` WRITE;
/*!40000 ALTER TABLE `booking_addons` DISABLE KEYS */;
/*!40000 ALTER TABLE `booking_addons` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bookings`
--

DROP TABLE IF EXISTS `bookings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `bookings` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `reference_code` varchar(20) NOT NULL,
  `name` varchar(160) NOT NULL,
  `email` varchar(160) NOT NULL,
  `phone` varchar(40) NOT NULL,
  `facebook` varchar(255) DEFAULT NULL,
  `shoot_type` varchar(120) NOT NULL,
  `preferred_date` date DEFAULT NULL,
  `location` varchar(200) DEFAULT NULL,
  `guest_count` varchar(40) DEFAULT NULL,
  `message` text DEFAULT NULL,
  `estimate_total` decimal(10,2) DEFAULT NULL,
  `estimate_breakdown` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`estimate_breakdown`)),
  `privacy_agreed` tinyint(1) NOT NULL DEFAULT 0,
  `privacy_agreed_at` datetime DEFAULT NULL,
  `status` enum('NEW','CONFIRMED','CANCELLED') NOT NULL DEFAULT 'NEW',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `reference_code` (`reference_code`),
  KEY `idx_bookings_email` (`email`),
  KEY `idx_bookings_status` (`status`),
  KEY `idx_bookings_preferred_date` (`preferred_date`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bookings`
--

LOCK TABLES `bookings` WRITE;
/*!40000 ALTER TABLE `bookings` DISABLE KEYS */;
INSERT INTO `bookings` VALUES (1,'JP-C94947','Vlad Neri','mereziko@gmail.com','090777777777','facebook/vladneri','Portrait','2026-08-31','rabot','67','67 uwu',NULL,NULL,1,'2026-08-26 18:46:48','CANCELLED','2026-08-26 18:46:48','2026-08-28 21:41:45'),(2,'JP-A35A36','hAYXHSXH','email@gmail.com','0999999999','facebook.usernameyohooo','Christening','2026-08-30','wer','90','21212sadasd',NULL,NULL,1,'2026-08-28 21:41:22','CONFIRMED','2026-08-28 21:41:22','2026-09-02 16:11:06');
/*!40000 ALTER TABLE `bookings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `calendar_events`
--

DROP TABLE IF EXISTS `calendar_events`;
CREATE TABLE `calendar_events` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `booking_id` int(10) unsigned DEFAULT NULL,
  `reference_code` varchar(24) NOT NULL,
  `name` varchar(160) NOT NULL,
  `email` varchar(160) DEFAULT NULL,
  `phone` varchar(40) DEFAULT NULL,
  `shoot_type` varchar(120) NOT NULL,
  `event_date` date NOT NULL,
  `location` varchar(200) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `status` enum('REQUESTED','BOOKED','CANCELLED') NOT NULL DEFAULT 'BOOKED',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `booking_id` (`booking_id`),
  UNIQUE KEY `reference_code` (`reference_code`),
  KEY `idx_calendar_events_date_status` (`event_date`,`status`),
  CONSTRAINT `fk_calendar_event_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `calendar_events` (`booking_id`,`reference_code`,`name`,`email`,`phone`,`shoot_type`,`event_date`,`location`,`notes`,`status`,`created_at`,`updated_at`)
SELECT `id`, CONCAT('CAL-', `reference_code`), `name`, `email`, `phone`, `shoot_type`, `preferred_date`, `location`, `message`,
       CASE WHEN `status` = 'CANCELLED' THEN 'CANCELLED' ELSE 'BOOKED' END, `created_at`, `updated_at`
FROM `bookings`
WHERE `status` IN ('CONFIRMED','CANCELLED') AND `preferred_date` IS NOT NULL;

--
-- Table structure for table `contact_platforms`
--

DROP TABLE IF EXISTS `contact_platforms`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `contact_platforms` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `label` varchar(80) NOT NULL,
  `tagline` varchar(180) DEFAULT NULL,
  `handle` varchar(160) DEFAULT NULL,
  `link` varchar(255) NOT NULL,
  `icon` varchar(60) NOT NULL DEFAULT 'link',
  `visible` tinyint(1) NOT NULL DEFAULT 1,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contact_platforms`
--

LOCK TABLES `contact_platforms` WRITE;
/*!40000 ALTER TABLE `contact_platforms` DISABLE KEYS */;
INSERT INTO `contact_platforms` VALUES (1,'Instagram','See what we\'re currently obsessed with.','@jonathanphotography','https://instagram.com/jonathanphotography','instagram',1,1,'2026-08-26 17:01:20','2026-08-26 17:01:20'),(2,'Facebook','For the aunties, relatives, and everyone else.','Jonathan Photography','https://facebook.com/jonathanphotography','facebook',1,2,'2026-08-26 17:01:20','2026-08-26 17:01:20'),(3,'Phone / Viber','When typing feels like too much work.','0963-332-7847','tel:+639633327847','phone',1,3,'2026-08-26 17:01:20','2026-08-26 17:01:20'),(4,'Email','For the serious stuff. Or the not-so-serious stuff.','mereziko@gmail.com','mailto:mereziko@gmail.com','mail',1,4,'2026-08-26 17:01:20','2026-08-26 17:01:20');
/*!40000 ALTER TABLE `contact_platforms` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `estimator_addons`
--

DROP TABLE IF EXISTS `estimator_addons`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `estimator_addons` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `label` varchar(120) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `active` tinyint(1) NOT NULL DEFAULT 1,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `is_quantity_based` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `estimator_addons`
--

LOCK TABLES `estimator_addons` WRITE;
/*!40000 ALTER TABLE `estimator_addons` DISABLE KEYS */;
INSERT INTO `estimator_addons` VALUES (1,'Second Photographer','An additional shooter for a second angle on every moment.',3000.00,1,1,'2026-09-02 18:21:53','2026-09-02 18:21:53',0),(2,'Videographer','Full video coverage alongside your photographer.',8000.00,1,2,'2026-09-02 18:21:53','2026-09-02 18:21:53',0),(3,'Rush Delivery','Edited gallery delivered within 72 hours.',1500.00,1,3,'2026-09-02 18:21:53','2026-09-02 18:21:53',0),(4,'Printed Photo Album','A 20-page hardbound album of your favorite shots.',2500.00,1,4,'2026-09-02 18:21:53','2026-09-02 18:21:53',0),(5,'Photo Booth','An on-site photo booth with instant prints.',4000.00,1,5,'2026-09-02 18:21:53','2026-09-02 18:21:53',0),(6,'Additional Hour','One extra hour of coverage, billed per hour selected.',1500.00,1,6,'2026-09-02 18:21:53','2026-09-02 18:21:53',1),(7,'Tarpaulin','A printed tarpaulin for your event.',500.00,1,7,'2026-09-02 18:21:53','2026-09-02 18:21:53',0);
/*!40000 ALTER TABLE `estimator_addons` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `estimator_hours`
--

DROP TABLE IF EXISTS `estimator_hours`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `estimator_hours` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `label` varchar(80) NOT NULL,
  `hours` decimal(5,2) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `active` tinyint(1) NOT NULL DEFAULT 1,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `estimator_hours`
--

LOCK TABLES `estimator_hours` WRITE;
/*!40000 ALTER TABLE `estimator_hours` DISABLE KEYS */;
INSERT INTO `estimator_hours` VALUES (1,'2 Hours',2.00,5005.00,1,1,'2026-08-26 17:01:20','2026-08-28 20:04:17'),(2,'4 Hours',4.00,8000.00,1,2,'2026-08-26 17:01:20','2026-08-26 17:01:20'),(3,'6 Hours',6.00,12000.00,1,3,'2026-08-26 17:01:20','2026-08-26 17:01:20'),(4,'8 Hours',8.00,16000.00,1,4,'2026-08-26 17:01:20','2026-08-26 17:01:20');
/*!40000 ALTER TABLE `estimator_hours` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `estimator_leads`
--

DROP TABLE IF EXISTS `estimator_leads`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `estimator_leads` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(160) NOT NULL,
  `email` varchar(160) NOT NULL,
  `hours` decimal(5,2) DEFAULT NULL,
  `addons` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`addons`)),
  `service_type` varchar(120) DEFAULT NULL,
  `total` decimal(10,2) NOT NULL,
  `booked` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `status` enum('New','Booked','Lost') NOT NULL DEFAULT 'New',
  PRIMARY KEY (`id`),
  KEY `idx_leads_email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `estimator_leads`
--

LOCK TABLES `estimator_leads` WRITE;
/*!40000 ALTER TABLE `estimator_leads` DISABLE KEYS */;
INSERT INTO `estimator_leads` VALUES (1,'Mikael Vladimir M. Neri','mereziko@gmail.com',8.00,'[]','',16000.00,0,'2026-08-28 20:04:53','New'),(2,'Kimberly Yu','kimetc@gmail.com',8.00,'[{\"label\":\"Second Photographer\",\"price\":\"3000.00\"},{\"label\":\"Videographer\",\"price\":\"8000.00\"},{\"label\":\"Rush Delivery\",\"price\":\"1500.00\"},{\"label\":\"Printed Photo Album\",\"price\":\"2500.00\"},{\"label\":\"Photo Booth\",\"price\":\"4000.00\"},{\"label\":\"Additional Hour\",\"price\":\"1500.00\"},{\"label\":\"Tarpaulin\",\"price\":\"500.00\"}]','Photo Booth',37000.00,0,'2026-08-28 20:07:41','New'),(3,'wowowoowow','wowowowowowo@gmail.com',2.00,'[]','',5005.00,0,'2026-08-28 21:48:34','New');
/*!40000 ALTER TABLE `estimator_leads` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `estimator_service_types`
--

DROP TABLE IF EXISTS `estimator_service_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `estimator_service_types` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `slug` varchar(100) NOT NULL,
  `base_price` decimal(10,2) NOT NULL DEFAULT 0.00,
  `description` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `estimator_service_types`
--

LOCK TABLES `estimator_service_types` WRITE;
/*!40000 ALTER TABLE `estimator_service_types` DISABLE KEYS */;
INSERT INTO `estimator_service_types` VALUES (1,'Engagement Shoot','engagement-shoot',15000.00,'Engagement photography',1,1,'2026-08-31 12:09:06','2026-08-31 12:09:06'),(2,'Wedding','wedding',35000.00,'Wedding photography',1,2,'2026-08-31 12:09:06','2026-08-31 12:09:06'),(3,'Portrait','portrait',10000.00,'Portrait photography',1,3,'2026-08-31 12:09:06','2026-08-31 12:09:06'),(4,'Event','event',20000.00,'Event photography',1,4,'2026-08-31 12:09:06','2026-08-31 12:09:06');
/*!40000 ALTER TABLE `estimator_service_types` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `portfolio_categories`
--

DROP TABLE IF EXISTS `portfolio_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `portfolio_categories` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(120) NOT NULL,
  `slug` varchar(140) NOT NULL,
  `description` text DEFAULT NULL,
  `cover_image` varchar(255) DEFAULT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `visible` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `portfolio_categories`
--

LOCK TABLES `portfolio_categories` WRITE;
/*!40000 ALTER TABLE `portfolio_categories` DISABLE KEYS */;
INSERT INTO `portfolio_categories` VALUES (1,'Weddings','weddings','For the moments that only happen once.','/uploads/portfolio/demo/wedding-cover.jpg',1,1,'2026-08-26 17:01:19','2026-08-26 17:01:19'),(2,'Engagement','engagement','The quiet before the big yes, in full colour.','/uploads/portfolio/demo/engagement-cover.jpg',2,1,'2026-08-26 17:01:19','2026-08-26 17:01:19'),(3,'Portraits','portraits','One face, studied properly.','/uploads/portfolio/demo/portrait-cover.jpg',3,1,'2026-08-26 17:01:19','2026-08-26 17:01:19'),(4,'Events','events','Rooms full of people who will want proof they were there.','/uploads/portfolio/demo/event-cover.jpg',4,1,'2026-08-26 17:01:19','2026-08-26 17:01:19'),(5,'Porno Shoot','porno-shoot','porno',NULL,5,1,'2026-08-28 20:02:01','2026-08-28 20:02:12');
/*!40000 ALTER TABLE `portfolio_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `portfolio_images`
--

DROP TABLE IF EXISTS `portfolio_images`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `portfolio_images` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `shoot_id` int(10) unsigned NOT NULL,
  `image_path` varchar(255) NOT NULL,
  `title` varchar(160) DEFAULT NULL,
  `caption` text DEFAULT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `is_cover` tinyint(1) NOT NULL DEFAULT 0,
  `visible` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_image_shoot` (`shoot_id`),
  CONSTRAINT `fk_image_shoot` FOREIGN KEY (`shoot_id`) REFERENCES `portfolio_shoots` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `portfolio_images`
--

LOCK TABLES `portfolio_images` WRITE;
/*!40000 ALTER TABLE `portfolio_images` DISABLE KEYS */;
INSERT INTO `portfolio_images` VALUES (1,1,'/uploads/portfolio/demo/wedding-01.jpg','First Look','The first look, seconds before either of them could speak.',1,1,1,'2026-08-26 17:01:19','2026-08-26 17:01:19'),(2,1,'/uploads/portfolio/demo/wedding-02.jpg','The Vows',NULL,2,0,1,'2026-08-26 17:01:19','2026-08-26 17:01:19'),(3,1,'/uploads/portfolio/demo/wedding-03.jpg','Reception',NULL,3,0,1,'2026-08-26 17:01:19','2026-08-26 17:01:19'),(4,2,'/uploads/portfolio/demo/engagement-01.jpg','Coastline',NULL,1,1,1,'2026-08-26 17:01:19','2026-08-26 17:01:19'),(5,2,'/uploads/portfolio/demo/engagement-02.jpg','Golden Hour',NULL,2,0,1,'2026-08-26 17:01:19','2026-08-26 17:01:19'),(6,3,'/uploads/portfolio/demo/portrait-01.jpg','Portrait Study I',NULL,1,1,1,'2026-08-26 17:01:19','2026-08-26 17:01:19'),(7,3,'/uploads/portfolio/demo/portrait-02.jpg','Portrait Study II',NULL,2,0,1,'2026-08-26 17:01:19','2026-08-26 17:01:19'),(8,4,'/uploads/portfolio/demo/event-01.jpg','Grand Entrance',NULL,1,1,1,'2026-08-26 17:01:19','2026-08-26 17:01:19'),(9,4,'/uploads/portfolio/demo/event-02.jpg','The Program',NULL,2,0,1,'2026-08-26 17:01:19','2026-08-26 17:01:19'),(10,5,'/uploads/portfolio/shoot-5/b81ce068ed4c8d5605e2e36ca2fd53d6.jpg','','',1,1,1,'2026-08-26 17:45:49','2026-08-26 17:46:26');
/*!40000 ALTER TABLE `portfolio_images` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `portfolio_shoots`
--

DROP TABLE IF EXISTS `portfolio_shoots`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `portfolio_shoots` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `category_id` int(10) unsigned NOT NULL,
  `title` varchar(160) NOT NULL,
  `slug` varchar(180) NOT NULL,
  `description` text DEFAULT NULL,
  `location` varchar(160) DEFAULT NULL,
  `shoot_date` date DEFAULT NULL,
  `cover_image_id` int(10) unsigned DEFAULT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `visible` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_category_slug` (`category_id`,`slug`),
  KEY `fk_shoot_cover_image` (`cover_image_id`),
  CONSTRAINT `fk_shoot_category` FOREIGN KEY (`category_id`) REFERENCES `portfolio_categories` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_shoot_cover_image` FOREIGN KEY (`cover_image_id`) REFERENCES `portfolio_images` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `portfolio_shoots`
--

LOCK TABLES `portfolio_shoots` WRITE;
/*!40000 ALTER TABLE `portfolio_shoots` DISABLE KEYS */;
INSERT INTO `portfolio_shoots` VALUES (1,1,'John & Maria','john-and-maria','A full-day wedding coverage from preparation to reception, shot on location in San Carlos City.','San Carlos City, Pangasinan','2026-06-14',1,1,1,'2026-08-26 17:01:19','2026-08-26 17:01:19'),(2,2,'Mika & D','mika-and-d','A golden-hour engagement session at the coast.','Bolinao, Pangasinan','2026-03-02',4,1,1,'2026-08-26 17:01:19','2026-08-26 17:01:19'),(3,3,'Studio Sessions Vol. 1','studio-sessions-vol-1','A set of controlled-light studio portraits.','Jonathan Photography Studio','2026-01-20',6,1,1,'2026-08-26 17:01:19','2026-08-26 17:01:20'),(4,4,'Debut — Ysabel Turns 18','debut-ysabel-turns-18','Full event coverage of an 18th birthday celebration.','Sison, Pangasinan','2025-11-08',8,1,1,'2026-08-26 17:01:19','2026-08-26 17:01:20'),(5,3,'Vlad Neri','vlad-neri','the only one who can beat me is me','gym BOO rat','2026-08-21',10,0,1,'2026-08-26 17:45:31','2026-08-26 17:45:49');
/*!40000 ALTER TABLE `portfolio_shoots` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `services`
--

DROP TABLE IF EXISTS `services`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `services` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(160) NOT NULL,
  `slug` varchar(180) NOT NULL,
  `category` varchar(60) NOT NULL DEFAULT 'photography',
  `base_price` decimal(10,2) NOT NULL DEFAULT 0.00,
  `description` text DEFAULT NULL,
  `image_path` varchar(255) DEFAULT NULL,
  `starting_price` decimal(10,2) DEFAULT NULL,
  `visible` tinyint(1) NOT NULL DEFAULT 1,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `services`
--

LOCK TABLES `services` WRITE;
/*!40000 ALTER TABLE `services` DISABLE KEYS */;
INSERT INTO `services` VALUES (1,'Wedding Photography','wedding-photography','photography',0.00,'Full-day coverage from preparation to reception, delivered as an edited story.',NULL,16000.00,1,1,'2026-08-26 17:01:20','2026-08-26 17:01:20'),(2,'Engagement Photography','engagement-photography','photography',0.00,'A relaxed on-location session for the two of you, before the big one.',NULL,6000.00,1,2,'2026-08-26 17:01:20','2026-08-26 17:01:20'),(3,'Birthday Photography','birthday-photography','photography',0.00,'Coverage for birthday celebrations of any scale.',NULL,5000.00,1,3,'2026-08-26 17:01:20','2026-08-26 17:01:20'),(4,'Christening Photography','christening-photography','photography',0.00,'Documentation of the ceremony and the celebration that follows.',NULL,5000.00,1,4,'2026-08-26 17:01:20','2026-08-26 17:01:20'),(5,'Debut Photography','debut-photography','photography',0.00,'Full coverage for the 18th birthday program, from prep to the last dance.',NULL,8000.00,1,5,'2026-08-26 17:01:20','2026-08-26 17:01:20'),(6,'Burial Photography','burial-photography','photography',0.00,'Respectful, discreet documentation for memorial services.',NULL,5000.00,1,6,'2026-08-26 17:01:20','2026-08-26 17:01:20'),(7,'Event Photography','event-photography','photography',0.00,'General coverage for corporate events, reunions, and gatherings.',NULL,6000.00,1,7,'2026-08-26 17:01:20','2026-08-26 17:01:20'),(8,'Portrait Photography','portrait-photography','photography',0.00,'Studio or on-location portraits, individual or family.',NULL,3000.00,1,8,'2026-08-26 17:01:20','2026-08-26 17:01:20'),(9,'Photo Booth','photo-booth','additional',0.00,'An on-site photo booth with instant prints for your guests.',NULL,4000.00,0,0,'2026-08-26 17:01:20','2026-08-31 20:30:53'),(10,'Picture Frames','picture-frames','additional',0.00,'Custom-printed frames for your favorite shots.',NULL,350.00,0,10,'2026-08-26 17:01:20','2026-08-31 20:30:54'),(11,'Tarpaulin','tarpaulin','additional',0.00,'Printed tarpaulins for events, streamers, and welcome signage.',NULL,500.00,0,11,'2026-08-26 17:01:20','2026-08-31 20:30:56'),(12,'Invitations','invitations','additional',0.00,'Designed and printed invitations to match your event.',NULL,15.00,0,12,'2026-08-26 17:01:20','2026-08-31 20:30:56'),(13,'Souvenirs','souvenirs','additional',0.00,'Printed souvenir items for guests to take home.',NULL,20.00,0,13,'2026-08-26 17:01:20','2026-08-31 20:30:57'),(14,'ID PVC','id-pvc','additional',0.00,'Durable PVC ID printing.',NULL,150.00,0,14,'2026-08-26 17:01:20','2026-08-31 20:31:14'),(15,'Digital Photo Printing','digital-photo-printing','additional',0.00,'Standard and large-format photo prints.',NULL,15.00,0,15,'2026-08-26 17:01:20','2026-08-31 20:31:16'),(16,'Photo & Video Coverage','photo-video-coverage','additional',0.00,'Combined photo and video documentation for any occasion.',NULL,18000.00,1,16,'2026-08-26 17:01:20','2026-08-26 17:01:20');
/*!40000 ALTER TABLE `services` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `site_settings`
--

DROP TABLE IF EXISTS `site_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `site_settings` (
  `setting_key` varchar(80) NOT NULL,
  `setting_value` text DEFAULT NULL,
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `site_settings`
--

LOCK TABLES `site_settings` WRITE;
/*!40000 ALTER TABLE `site_settings` DISABLE KEYS */;
INSERT INTO `site_settings` VALUES ('business_address','0013 Mc Arthur Hi-way, Brgy. Asan Norte, Sison, Pangasinan','2026-08-26 17:01:20'),('business_email','mereziko@gmail.com','2026-08-26 17:01:20'),('business_name','Jonathan Photography','2026-08-26 17:01:20'),('business_phone','0963-332-7847','2026-08-26 17:01:20'),('business_phone_alt','0927-776-3101','2026-08-26 17:01:20'),('business_tagline','Digital Photo & Video Coverage','2026-08-26 17:01:20');
/*!40000 ALTER TABLE `site_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'jonathan_photography'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-09-02 18:23:38
