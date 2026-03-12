-- Update verification status logic to properly use DEBUNKED for outdated content

CREATE OR REPLACE FUNCTION update_verification_truth_score()
RETURNS TRIGGER AS $$
BEGIN
  WITH vote_counts AS (
    SELECT 
      verification_id,
      SUM(CASE WHEN vote_type = 'true' THEN 1 ELSE 0 END) AS true_count,
      SUM(CASE WHEN vote_type = 'misleading' THEN 1 ELSE 0 END) AS misleading_count,
      SUM(CASE WHEN vote_type = 'outdated' THEN 1 ELSE 0 END) AS outdated_count,
      COUNT(*) AS total
    FROM public.verification_votes
    WHERE verification_id = COALESCE(NEW.verification_id, OLD.verification_id)
    GROUP BY verification_id
  )
  UPDATE public.verifications v
  SET 
    truth_score = LEAST(100, GREATEST(0, ROUND((vc.true_count::NUMERIC / NULLIF(vc.total, 0)) * 100))),
    total_votes = vc.total,
    status = CASE 
      -- VERIFIED: More than 80% accurate votes
      WHEN (vc.true_count::NUMERIC / NULLIF(vc.total, 0)) > 0.8 THEN 'VERIFIED'
      
      -- DEBUNKED: Outdated votes are the majority
      WHEN vc.outdated_count > vc.true_count AND vc.outdated_count > vc.misleading_count THEN 'DEBUNKED'
      
      -- DISPUTED: Less than 40% accurate OR misleading votes dominate
      WHEN (vc.true_count::NUMERIC / NULLIF(vc.total, 0)) < 0.4 THEN 'DISPUTED'
      WHEN vc.misleading_count > vc.true_count THEN 'DISPUTED'
      
      -- PENDING: Everything else (unclear majority)
      ELSE 'PENDING'
    END,
    updated_at = NOW()
  FROM vote_counts vc
  WHERE v.id = vc.verification_id;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;
