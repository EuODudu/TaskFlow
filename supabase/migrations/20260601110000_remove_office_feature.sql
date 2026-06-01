DROP TABLE IF EXISTS public.office_items CASCADE;

DELETE FROM public.avatar_items
WHERE category IN ('office_item', 'office_theme')
   OR slug LIKE 'office_%';
