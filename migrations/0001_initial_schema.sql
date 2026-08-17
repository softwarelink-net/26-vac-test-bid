-- 用户表 (Users & RBAC)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    real_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin', 'vv_engineer', 'dev_engineer', 'auditor', 'viewer')),
    department TEXT,
    ca_cert_serial TEXT,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 系统配置与 Feature Flags 表
CREATE TABLE IF NOT EXISTS system_configs (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 招标公告与标讯全要素表
CREATE TABLE IF NOT EXISTS tender_notices (
    id TEXT PRIMARY KEY,
    project_code TEXT NOT NULL UNIQUE,
    project_name TEXT NOT NULL,
    purchaser TEXT NOT NULL,
    publish_time TEXT NOT NULL,
    bid_deadline TEXT NOT NULL,
    budget_amount REAL,
    status TEXT NOT NULL,
    doc_price REAL DEFAULT 500.00,
    content_summary TEXT,
    specifications TEXT,
    compliance_rules TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 发电机参数辨识记录表 (Parameter Identification)
CREATE TABLE IF NOT EXISTS generator_identifications (
    id TEXT PRIMARY KEY,
    test_unit_name TEXT NOT NULL,
    generator_type TEXT NOT NULL,
    rated_voltage REAL DEFAULT 115.0,
    frequency_range TEXT DEFAULT '360Hz-800Hz',
    saturated_curve_data TEXT NOT NULL,
    calculated_parameters TEXT NOT NULL,
    error_margin REAL,
    identified_by TEXT REFERENCES users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 自动化测试用例与 DO-178C 适航矩阵表 (Test Cases & Traceability)
CREATE TABLE IF NOT EXISTS test_cases (
    id TEXT PRIMARY KEY,
    case_code TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    standard_ref TEXT DEFAULT 'DO-178C / MIL-STD-704F',
    test_category TEXT NOT NULL,
    hlr_ref TEXT NOT NULL,
    llr_ref TEXT NOT NULL,
    target_coverage TEXT DEFAULT 'MC/DC',
    execution_script TEXT NOT NULL,
    last_status TEXT DEFAULT 'pending',
    last_duration_ms INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 瞬态波形高频采集日志表 (Waveform Samples)
CREATE TABLE IF NOT EXISTS waveform_records (
    id TEXT PRIMARY KEY,
    test_case_id TEXT REFERENCES test_cases(id),
    trigger_event TEXT NOT NULL,
    voltage_rms REAL NOT NULL,
    frequency_val REAL NOT NULL,
    recovery_time_ms REAL,
    thd_percentage REAL,
    waveform_data_url TEXT,
    is_compliant BOOLEAN DEFAULT 1,
    captured_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 安全审计日志表 (Three-Role Security Audit Logs)
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id),
    action TEXT NOT NULL,
    target_module TEXT NOT NULL,
    ip_address TEXT,
    details TEXT,
    security_level TEXT DEFAULT 'CONFIDENTIAL',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 预置种子数据 (Seed Data)
INSERT OR IGNORE INTO system_configs (key, value, description, is_public) VALUES
('FEATURE_AUTO_CALC_IDENTIFICATION', 'true', '是否启用发电机参数自动辨识算法内核', 1),
('FEATURE_MIL_STD_704F_CHECK', 'true', '是否开启供电品质标准实时校验', 1),
('GLOBAL_BANNER_TEXT', '获取网站源码，请访问：https://github.com/softwarelink-net/26-vac-test-bid。', '顶部通栏文字', 1);

INSERT OR IGNORE INTO users (id, username, email, password_hash, real_name, role, department) VALUES
('usr-admin-01', 'admin', 'admin@avic-sepc.com', 'scrypt_mock_admin_hash', '李德强', 'admin', '试验测试部'),
('usr-tester-01', 'tester', 'tester@avic-sepc.com', 'scrypt_mock_tester_hash', '管子婧', 'vv_engineer', '适航验证中心'),
('usr-auditor-01', 'auditor', 'auditor@avic-sepc.com', 'scrypt_mock_auditor_hash', '李桐', 'auditor', '纪检审计处');

INSERT OR IGNORE INTO tender_notices (id, project_code, project_name, purchaser, publish_time, bid_deadline, budget_amount, status, content_summary, specifications) VALUES
('tnd-0730-2611010438', '0730-2611010438/01', '115VAC变频交流发电软件测试平台', '陕西航空电气有限责任公司', '2026/08/13 18:03:43', '2026/09/03 09:30:00', 3500000.00, 'OPEN_FOR_BID', '主要针对主发电系统软件开发、测试、优化的需求，用于实现发电软件功能测试、不同工况下调压性能测试，保障测试需求覆盖度，满足 DO-178C 适航标准。', '由三级式发电机数字调压软件参数辨识设备、模块化变频发电软件程控集成测试台、发电调压软件瞬态实时测试工具三部分组成。');

INSERT OR IGNORE INTO users (id, username, email, password_hash, real_name, role, department) VALUES
('usr-dev-01', 'developer', 'dev@avic-sepc.com', 'scrypt_mock_dev_hash', '王启明', 'dev_engineer', '算法研发室'),
('usr-viewer-01', 'viewer', 'viewer@avic-sepc.com', 'scrypt_mock_viewer_hash', '外部专家', 'viewer', '外协评审组');

INSERT OR IGNORE INTO generator_identifications (id, test_unit_name, generator_type, rated_voltage, frequency_range, saturated_curve_data, calculated_parameters, error_margin, identified_by) VALUES
('gid-001', 'VF-AC-GCU-A01', 'Three-Stage Brushless VF-AC', 115.0, '360Hz-800Hz',
 '[{"if":0.2,"psi":0.18},{"if":0.4,"psi":0.35},{"if":0.6,"psi":0.48},{"if":0.8,"psi":0.58},{"if":1.0,"psi":0.65},{"if":1.2,"psi":0.70},{"if":1.4,"psi":0.73}]',
 '{"Ld":0.00215,"Lq":0.00342,"Td0":1.85,"Td_prime":0.042,"Tdo_dprime":0.008,"Ra":0.012,"Xs":0.85,"Xsd":0.18}',
 1.8, 'usr-dev-01'),
('gid-002', 'VF-AC-GCU-B07', 'Three-Stage Brushless VF-AC', 115.0, '360Hz-800Hz',
 '[{"if":0.2,"psi":0.17},{"if":0.4,"psi":0.33},{"if":0.6,"psi":0.46},{"if":0.8,"psi":0.56},{"if":1.0,"psi":0.63},{"if":1.2,"psi":0.68},{"if":1.4,"psi":0.71}]',
 '{"Ld":0.00208,"Lq":0.00335,"Td0":1.92,"Td_prime":0.045,"Tdo_dprime":0.009,"Ra":0.013,"Xs":0.82,"Xsd":0.17}',
 2.1, 'usr-tester-01');

INSERT OR IGNORE INTO test_cases (id, case_code, title, standard_ref, test_category, hlr_ref, llr_ref, target_coverage, execution_script, last_status, last_duration_ms) VALUES
('tc-001', 'TC-VR-001', '稳态调压精度验证 115VAC@400Hz', 'DO-178C / MIL-STD-704F', 'Functional', 'HLR-GCU-001', 'LLR-VR-011', 'MC/DC', 'SEQ:SET_FREQ(400);SET_LOAD(0.5pu);ASSERT_Vrms(115,1.5%)', 'passed', 12450),
('tc-002', 'TC-TR-002', '突加负载瞬态恢复时间 Tr', 'DO-178C / MIL-STD-704F', 'Transient', 'HLR-GCU-014', 'LLR-TR-021', 'MC/DC', 'SEQ:STEP_LOAD(+0.5pu);CAPTURE_WAVE(2s);ASSERT_Tr(<40ms)', 'passed', 8320),
('tc-003', 'TC-TR-003', '突卸负载过压抑制与恢复', 'DO-178C / MIL-STD-704F', 'Transient', 'HLR-GCU-015', 'LLR-TR-022', 'MC/DC', 'SEQ:STEP_LOAD(-0.5pu);CAPTURE_WAVE(2s);ASSERT_Vpeak(<180)', 'passed', 9100),
('tc-004', 'TC-PF-004', '单相短路保护动作时序', 'DO-178C / GJB 181B', 'Protection', 'HLR-GCU-028', 'LLR-PF-041', 'MC/DC', 'SEQ:INJECT_FAULT(phaseA_short);ASSERT_TRIP(<20ms)', 'failed', 15600),
('tc-005', 'TC-FI-005', '过压欠压保护故障注入', 'DO-178C / MIL-STD-704F', 'Fault Injection', 'HLR-GCU-032', 'LLR-FI-051', 'MC/DC', 'SEQ:INJECT_OV(140V);ASSERT_PROTECT;INJECT_UV(90V);ASSERT_PROTECT', 'pending', NULL),
('tc-006', 'TC-FQ-006', '变频工况 360Hz-800Hz 扫频稳定性', 'DO-178C / MIL-STD-704F', 'Functional', 'HLR-GCU-008', 'LLR-FQ-018', 'Statement', 'SEQ:SWEEP_FREQ(360,800,20);ASSERT_Vrms(115,2%)', 'running', NULL),
('tc-007', 'TC-TH-007', '谐波畸变率 THD 合规性校验', 'DO-178C / GJB 181B', 'Functional', 'HLR-GCU-019', 'LLR-TH-033', 'MC/DC', 'SEQ:FFT_ANALYZE;ASSERT_THD(<5%)', 'passed', 22100),
('tc-008', 'TC-ID-008', '三级式发电机参数辨识闭环比对', 'DO-178C', 'Functional', 'HLR-ID-001', 'LLR-ID-003', 'Decision', 'SEQ:RUN_IDENT;COMPARE_PARAMS(Ld,Lq,Td0);ASSERT_ERR(<3%)', 'passed', 45800);

INSERT OR IGNORE INTO waveform_records (id, test_case_id, trigger_event, voltage_rms, frequency_val, recovery_time_ms, thd_percentage, waveform_data_url, is_compliant) VALUES
('wf-001', 'tc-002', 'Step Load Add', 114.8, 400.2, 28.5, 2.1, 'r2://26-vac-test-bid-assets/waveforms/wf-001.json', 1),
('wf-002', 'tc-003', 'Step Load Drop', 116.2, 399.8, 32.1, 2.4, 'r2://26-vac-test-bid-assets/waveforms/wf-002.json', 1),
('wf-003', 'tc-004', 'Short Circuit', 42.5, 398.5, NULL, 18.6, 'r2://26-vac-test-bid-assets/waveforms/wf-003.json', 0),
('wf-004', 'tc-001', 'Steady State', 115.1, 400.0, NULL, 1.8, 'r2://26-vac-test-bid-assets/waveforms/wf-004.json', 1),
('wf-005', 'tc-007', 'Over-Voltage', 138.2, 401.5, 45.0, 3.2, 'r2://26-vac-test-bid-assets/waveforms/wf-005.json', 1);

INSERT OR IGNORE INTO audit_logs (id, user_id, action, target_module, ip_address, details, security_level) VALUES
('aud-001', 'usr-admin-01', 'LOGIN_SUCCESS', 'auth', '10.12.8.21', '管理员登录系统控制台', 'CONFIDENTIAL'),
('aud-002', 'usr-tester-01', 'EXPORT_EVIDENCE_PACK', 'compliance', '10.12.8.45', '导出 DO-178C 适航审核证据包 v1.2', 'SECRET'),
('aud-003', 'usr-dev-01', 'RUN_IDENTIFICATION', 'identification', '10.12.9.12', '执行 VF-AC-GCU-A01 参数辨识拟合', 'CONFIDENTIAL'),
('aud-004', 'usr-auditor-01', 'VIEW_AUDIT_STREAM', 'audit', '10.12.1.8', '审计员查阅不可篡改日志流', 'SECRET'),
('aud-005', 'usr-tester-01', 'EXECUTE_TEST_SEQ', 'test-bench', '10.12.8.45', '执行回归序列 REG-360-800-BATCH', 'CONFIDENTIAL');
