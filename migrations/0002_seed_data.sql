-- Additional high-fidelity seed for local demos (idempotent)
INSERT OR IGNORE INTO test_cases (id, case_code, title, standard_ref, test_category, hlr_ref, llr_ref, target_coverage, execution_script, last_status, last_duration_ms) VALUES
('tc-009', 'TC-FQ-009', '800Hz 极限变频稳态供电品质', 'MIL-STD-704F', 'Functional', 'HLR-GCU-009', 'LLR-FQ-019', 'MC/DC', 'SEQ:SET_FREQ(800);ASSERT_Vrms(115,2%);ASSERT_THD(<5%)', 'passed', 18700),
('tc-010', 'TC-TR-010', '连续突加突卸循环应力测试', 'GJB 181B', 'Transient', 'HLR-GCU-016', 'LLR-TR-025', 'MC/DC', 'SEQ:LOOP(10):STEP_LOAD(+/-0.3pu);ASSERT_Tr(<50ms)', 'pending', NULL);
