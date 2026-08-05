-- Update reviews category check constraint to accept all categories used by the app
alter table reviews drop constraint if exists reviews_category_check;

alter table reviews add constraint reviews_category_check
check (category in (
  'Queue Management',
  'Driver Conduct',
  'Vehicle Condition',
  'Wait Time',
  'Safety Concern',
  'Fare Issue',
  'General Feedback',
  'queue_fairness',
  'safety',
  'app_usability',
  'driver_conduct',
  'other'
));
