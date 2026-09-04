-- One-time migration for irreversible estimator lead outcomes.

USE jonathan_photography;

UPDATE estimator_leads SET status = 'New' WHERE status = 'Contacted';
UPDATE estimator_leads SET status = 'Lost' WHERE status NOT IN ('New', 'Booked', 'Lost');

ALTER TABLE estimator_leads
  MODIFY status ENUM('New','Booked','Lost') NOT NULL DEFAULT 'New';

UPDATE estimator_leads SET booked = CASE WHEN status = 'Booked' THEN 1 ELSE 0 END;
