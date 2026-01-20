-- SCOs
INSERT INTO irad_scos (title, description, target_spend_percent) VALUES
('Autonomous Systems', 'Unmanned vehicles and swarm logic', 30.00),
('Cyber Effects', 'Offensive and defensive cyber capabilities', 25.00),
('Quantum Sensing', 'Next-gen sensors using quantum entanglement', 15.00),
('Hypersonics', 'High-speed flight dynamics and thermal protection', 20.00),
('Directed Energy', 'High-energy laser and microwave systems', 10.00)
ON CONFLICT (title) DO NOTHING;

-- Projects
-- Ensure we have a user. If not, these might fail or we default to 1.
-- We assume User 1 exists.

INSERT INTO irad_projects (sco_id, title, description, pi_id, status, total_budget) VALUES
((SELECT id FROM irad_scos WHERE title='Autonomous Systems'), 'Swarm-1', 'Drone swarm coordination protocol.', 1, 'active', 50000.00),
((SELECT id FROM irad_scos WHERE title='Autonomous Systems'), 'Auto-Nav', 'Vision-based navigation in GPS-denied environments.', 1, 'proposal', 25000.00),
((SELECT id FROM irad_scos WHERE title='Cyber Effects'), 'Zero-Day Hunter', 'Automated vulnerability scanning pipeline.', 1, 'completed', 75000.00),
((SELECT id FROM irad_scos WHERE title='Cyber Effects'), 'Red-Team Bot', 'Adversarial AI for network penetration.', 1, 'active', 45000.00),
((SELECT id FROM irad_scos WHERE title='Quantum Sensing'), 'Q-Radar', 'Quantum radar prototype for stealth detection.', 1, 'active', 120000.00),
((SELECT id FROM irad_scos WHERE title='Hypersonics'), 'Mach-5 Glider', 'Airframe stress testing materials study.', 1, 'concept', 10000.00),
((SELECT id FROM irad_scos WHERE title='Directed Energy'), 'Compact Laser', 'Miniaturized high-energy laser power source.', 1, 'proposal', 60000.00);

-- Transitions
INSERT INTO irad_transitions (project_id, outcome_type, description, captured_funding) VALUES
((SELECT id FROM irad_projects WHERE title='Zero-Day Hunter' LIMIT 1), 'Contract', 'Awarded DoD contract for cyber defense suite.', 1500000.00),
((SELECT id FROM irad_projects WHERE title='Swarm-1' LIMIT 1), 'White Paper', 'Published methodology in IEEE Robotics.', 0.00);
