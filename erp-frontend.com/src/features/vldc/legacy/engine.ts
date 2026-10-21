// @ts-nocheck
/*
 * Legacy page engine — ported from VLDC_ERP_Demo_10.1_RnD_AllStaff/app.js.
 *
 * The page templates (render.*) and modal builders are kept as HTML strings and
 * still write into #content. The application shell (login, sidebar, topbar,
 * modal, badges, role state) now lives in React: every place where the old
 * script touched the shell DOM goes through `shell` (see connectShell) instead.
 * Functions used by inline on* handlers are exposed on window at the bottom.
 */

import { installWorkflow, workflowBadges, workflowPerms } from "@/features/vldc/workflow/views";
import { escapeHtml } from "@/features/vldc/workflow/html";
import { vldcData } from "@/features/vldc/data/registry";
import { addDays, localToday, vnDate } from "@/features/vldc/data/dates";
import * as M from "@/features/vldc/data/metrics";
import { ROLE_PROFILES, canSeeProject, roleUnitCode, unitCodeOf } from "@/features/vldc/data/org";
import { installDataPages } from "@/features/vldc/data/pages";
import { baseDashboardHtml, hasUnitDashboard, installAccountingPages, unitDashboardHtml } from "@/features/vldc/data/accountingPages";
import { aiSearchHtml, aiStatsHtml, installKnowledgePages } from "@/features/vldc/data/knowledgePages";
import { installActions } from "@/features/vldc/data/actions";
import { installInboxPage } from "@/features/vldc/data/inboxPage";
import { installPlansPage } from "@/features/vldc/data/plansPage";
import { installNewsPage } from "@/features/vldc/data/newsPage";
import { installCapabilityPage } from "@/features/vldc/data/capabilityPage";
import { installDocAssign } from "@/features/vldc/data/docAssignPage";
import { installSciencePage } from "@/features/vldc/data/sciencePage";
import { calendarWeek } from "@/features/vldc/data/actionsCore";
import { workflowStore } from "@/features/vldc/workflow/repository";

// Business data lives in Firestore (src/features/vldc/data); these read the live, always-populated copies.
const D = (key) => vldcData.get(key);
const save = (key, row) => vldcData.save(key, row).catch((e) => console.warn('[VLDC] Lưu thất bại:', e));
const todayIso = () => localToday();
const todayVN = () => vnDate(localToday());
const noticeData = () => D('notices').map(n => ({ ...n, read: (n.readBy || []).includes(current) }));
const cap = () => D('orgStats')[0] || {};

type ShellBridge = {
  show: (page: string) => void;
  openModal: (title: string, html: string) => void;
  closeModal: () => void;
  refresh: () => void;
};
let shell: ShellBridge = { show() {}, openModal() {}, closeModal() {}, refresh() {} };
export function connectShell(bridge: ShellBridge) { shell = bridge; }

// Role profiles (title, unit, person) come from the backend via data/org; this is a live reference.
const roles=ROLE_PROFILES;
let current='lanhdao', currentPage='dashboard';
// Login, quick-account cards, setup() and switchRole() moved to React (LoginScreen, Sidebar, Topbar, store).
export function setCurrentRole(k: string) { current = k; }
export function getCurrentRole(): string { return current; }
const pages={news:['Bảng tin','Tin tức và sự kiện của Liên đoàn'],dashboard:['Dashboard điều hành','Tổng quan theo vai trò'],action:['Action Center','Một nơi xử lý mọi việc chờ'],assistant:['AI Knowledge Workspace','Tìm kiếm tài liệu, văn bản, hồ sơ nhân sự, thiết bị và dữ liệu nghiệp vụ'],projects:['Nhiệm vụ / Dự án','Hồ sơ số dự án, WBS, rủi ro, nguồn lực'],finance:['Kế hoạch - Tài chính','Ngân sách, chi phí, cam kết chi, thanh toán'],equipment:['Thiết bị','Vòng đời tài sản, kiểm định, điều chuyển'],hr:['Nhân sự','Hồ sơ năng lực, chứng chỉ, điều động'],dms:['DMS - Quản trị tài liệu','Metadata, version, tìm kiếm, check-in/out'],documents:['Văn bản','Văn bản đến/đi, trình ký, SLA'],contracts:['Hợp đồng CLM','Từ dự thảo đến thanh lý và nghĩa vụ'],generator:['Sinh văn bản','Tạo Word/PDF mô phỏng từ dữ liệu ERP'],reports:['Trung tâm báo cáo','Dashboard, Report Builder, scheduled reports'],alerts:['Cảnh báo & Rules','Quản trị quy tắc cảnh báo'],audit:['Audit Timeline','Truy vết thao tác và phiên bản']};
const visualMap={assistant:['field-visual','AI Knowledge Workspace','Tìm kiếm có dẫn nguồn trên DMS, văn bản, nhân sự, thiết bị, dự án, hợp đồng và dữ liệu lịch sử.'],dashboard:['executive-visual','Trung tâm điều hành số','Bức tranh tổng hợp về nhiệm vụ, nguồn lực, tài chính, hồ sơ và các quyết định cần xử lý.'],projects:['project-visual','Nhiệm vụ & Dự án','Quản trị xuyên suốt kế hoạch, WBS, tiến độ, hiện trường, nghiệm thu và nguồn lực.'],equipment:['equipment-visual','Thiết bị & Tài sản kỹ thuật','Theo dõi vòng đời, điều chuyển, kiểm định, hiệu chuẩn và mức sử dụng thiết bị địa vật lý.'],hr:['people-visual','Nhân sự & Năng lực','Quản trị hồ sơ, skill matrix, điều động và năng lực chuyên môn của các đơn vị.'],dms:['field-visual','Hồ sơ số & Dữ liệu','DMS, hồ sơ dự án, metadata, version, lưu trữ lịch sử và dữ liệu chuyên ngành.'],documents:['executive-visual','Văn bản & Điều hành','Tiếp nhận, phân luồng, trình ký, SLA và truy vết văn bản điện tử.'],contracts:['project-visual','Hợp đồng & Nghĩa vụ','Quản lý toàn vòng đời hợp đồng, nghiệm thu, thanh toán và công nợ.'],finance:['executive-visual','Kế hoạch – Tài chính','Theo dõi kế hoạch, dự toán, nguồn vốn, cam kết chi và phân tích quản trị.'],accounting:['executive-visual','Trung tâm Kế toán','Chứng từ, thanh toán, tạm ứng, công nợ, tài sản và báo cáo kế toán.'],calendar:['people-visual','Sự kiện & Kế hoạch','Lịch Liên đoàn, đơn vị, dự án và cá nhân trên một không gian làm việc thống nhất.'],communications:['people-visual','Thông báo & Truyền thông nội bộ','Thông tin theo phạm vi, nhắc việc và liên kết trực tiếp tới hồ sơ cần xử lý.']};
function addVisualHero(p){let cfg=visualMap[p];if(!cfg||p==='dashboard')return;let c=document.getElementById('content');if(!c||c.querySelector('.module-hero'))return;let h=document.createElement('div');h.className='module-hero '+cfg[0];h.innerHTML='<div><div class="hero-tag">VLDC DIGITAL WORKPLACE</div><h2>'+cfg[1]+'</h2><p>'+cfg[2]+'</p></div><div class="hero-tag">'+(pages[p]?.[0]||'Nghiệp vụ')+'</div>';c.prepend(h)}
// Navigation is owned by the React store; PageHost calls render[p]() + addVisualHero(p).
function show(p){currentPage=p;shell.show(p)}
const render={
dashboard(){document.getElementById('content').innerHTML=baseDashboardHtml()},
assistant(){document.getElementById('content').innerHTML=`
<div class="module-hero field-visual"><div><div class="hero-tag">AI KNOWLEDGE & SEARCH WORKSPACE</div><h2>Trợ lý AI nghiệp vụ Liên đoàn</h2><p>Tìm kiếm hợp nhất trên tài liệu, văn bản, nhân sự, thiết bị, dự án, hợp đồng, kế toán và kho dữ liệu lịch sử. Kết quả luôn gắn nguồn và tuân theo quyền người dùng.</p></div><div class="hero-tag">AI đề xuất • Con người quyết định</div></div>
<div class="grid two" style="margin-top:14px"><div class="ai-answer vx-ai-ask"><h3>✦ Hỏi Trợ lý AI</h3><p class="mini">Bạn có thể hỏi bằng ngôn ngữ tự nhiên. Ví dụ: “Tìm các quyết định liên quan dự án VLDC-2027-001”, “Ai có chứng chỉ GIS?”, “Máy P-12 hiện ở đâu?”.</p><textarea id="aiq" rows="3" placeholder="Nhập yêu cầu tìm kiếm, tổng hợp, soạn thảo hoặc phân tích..."></textarea><div class="vx-ai-foot"><div class="vx-ai-chips"><span>Gợi ý:</span><button onclick="aiFill('Tìm các quyết định và biên bản nghiệm thu của dự án VLDC-2027-001')">Tài liệu dự án</button><button onclick="aiFill('Tìm cán bộ có chuyên ngành địa vật lý và chứng chỉ GIS còn hiệu lực')">Hồ sơ nhân sự</button><button onclick="aiFill('Máy P-12 hiện ở đâu, ai đang giữ và khi nào hết hạn kiểm định?')">Thiết bị P-12</button><button onclick="aiFill('Các hợp đồng còn công nợ trên 60 ngày')">Hợp đồng / công nợ</button><button onclick="aiFill('Tóm tắt hồ sơ lịch sử về địa vật lý biển giai đoạn 2019-2024')">Kho lịch sử</button><button onclick="aiFill('Soạn báo cáo ngắn về các dự án có nguy cơ chậm')">Soạn báo cáo</button></div><button class="btn vx-ai-run" onclick="aiRun()">Tìm / Phân tích</button></div></div>
<div class="card"><h3>Phạm vi dữ liệu được phép tra cứu</h3><div id="aiPermission"></div><div class="ai-recent" style="margin-top:10px">${aiStatsHtml()}</div></div></div>
<div class="card" style="margin-top:14px"><div class="card-head"><h3>Chọn nguồn tìm kiếm</h3><span class="mini">Có thể tìm đồng thời nhiều nguồn</span></div><div class="ai-source-grid" id="aiSources"></div></div>
<div class="grid two" style="margin-top:14px"><div class="card"><div class="card-head"><h3>Kết quả & câu trả lời có dẫn nguồn</h3><button class="btn btn-light" onclick="aiRun()">Làm mới kết quả</button></div><div id="aiResult"><div class="mini">Nhập câu hỏi ở trên để xem kết quả mô phỏng có nguồn.</div></div></div><div class="card"><h3>Tác vụ AI hỗ trợ</h3><div class="metric"><span>Tìm kiếm hồ sơ</span><b>DMS • Archive • Văn bản</b></div><div class="metric"><span>Tìm chuyên gia</span><b>HR • Skill Matrix</b></div><div class="metric"><span>Tra cứu thiết bị</span><b>Equipment • Asset</b></div><div class="metric"><span>Tổng hợp dự án</span><b>Project • KPI • Risk</b></div><div class="metric"><span>Tra cứu hợp đồng</span><b>CLM • Công nợ</b></div><div class="metric"><span>Soạn thảo</span><b>Báo cáo • Công văn • Biên bản</b></div><div class="metric"><span>Mở hồ sơ nguồn</span><b>Luôn có liên kết kiểm chứng</b></div></div></div>`;renderAiSources();renderAiPermission();},
};
function openModal(t,b){shell.openModal(t,b)}function closeModal(){shell.closeModal()}
function aiFill(t){let el=document.getElementById('aiq');if(el)el.value=t}
const aiSourceDefs=[
 {id:'docs',icon:'▤',name:'Văn bản & Tài liệu',desc:'Công văn, quyết định, báo cáo, biên bản, DMS'},
 {id:'hr',icon:'♙',name:'Hồ sơ nhân sự',desc:'Chuyên môn, chứng chỉ, kinh nghiệm, đơn vị'},
 {id:'equipment',icon:'⚙',name:'Máy móc & Thiết bị',desc:'Vị trí, người giữ, kiểm định, lịch sử sửa chữa'},
 {id:'projects',icon:'▦',name:'Dự án & Nhiệm vụ',desc:'Tiến độ, WBS, nghiệm thu, rủi ro, hồ sơ'},
 {id:'contracts',icon:'⌁',name:'Hợp đồng & Công nợ',desc:'CLM, nghĩa vụ, hóa đơn, thanh toán'},
 {id:'accounting',icon:'₫',name:'Kế toán',desc:'Thanh toán, tạm ứng, công nợ, tài sản'},
 {id:'archive',icon:'▥',name:'Kho dữ liệu lịch sử',desc:'Legacy Archive, hồ sơ trước ERP'},
 {id:'geo',icon:'⌖',name:'Geo Data',desc:'GIS, raw data, processed data, metadata'}
];
let aiSelectedSources=new Set(['docs','projects','equipment','archive']);
function renderAiSources(){let el=document.getElementById('aiSources');if(!el)return;el.innerHTML=aiSourceDefs.map(x=>`<div class="ai-source ${aiSelectedSources.has(x.id)?'active':''}" onclick="toggleAiSource('${x.id}')"><b>${x.icon} ${x.name}</b><span>${x.desc}</span></div>`).join('')}
function toggleAiSource(id){aiSelectedSources.has(id)?aiSelectedSources.delete(id):aiSelectedSources.add(id);renderAiSources()}
function renderAiPermission(){let el=document.getElementById('aiPermission');if(!el)return;let r=roles[current];let msg=current==='lanhdao'?'Toàn bộ dữ liệu nghiệp vụ trong phạm vi lãnh đạo, trừ trường dữ liệu bị khóa theo chính sách bảo mật đặc biệt.':current==='tochuc'?'Được tra cứu đầy đủ hồ sơ TC-HC và dữ liệu chung; dữ liệu kế toán chi tiết chỉ hiện theo quyền phối hợp.':current==='kythuat'?'Được tra cứu đầy đủ dự án, kỹ thuật, thiết bị và hồ sơ chuyên môn; hồ sơ nhân sự chỉ hiện thông tin năng lực phục vụ công việc.':'Chỉ hiển thị dữ liệu thuộc đơn vị, dự án hoặc hồ sơ mà tài khoản được phân quyền.';el.innerHTML=`<div class="ai-permission"><b>🔐 ${r.title}</b><br>${msg}<br><span class="mini">AI không vượt qua phân quyền ERP; kết quả nhạy cảm có thể bị ẩn trường dữ liệu.</span></div>`}
function aiRun(){
 const q=(document.getElementById('aiq')?.value||'').trim();
 const el=document.getElementById('aiResult'); if(el) el.innerHTML=aiSearchHtml(q,[...aiSelectedSources]);
}
function tab(btn,id){btn.parentElement.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));btn.classList.add('active');btn.parentElement.parentElement.querySelectorAll('.tabpane').forEach(x=>x.classList.remove('active'));document.getElementById(id).classList.add('active')}

// ===== VLDC ERP DEMO 5.0 - DATA & ARCHIVE CENTER =====
Object.assign(pages,{
 datahub:['Data Hub','Một cổng quản trị Master Data, dữ liệu vận hành, tài liệu, legacy và geo data'],
 archive:['Kho hồ sơ lịch sử','Hồ sơ trước ERP, số hóa, metadata, vị trí hồ sơ giấy và chế độ chỉ đọc'],
 importdata:['Import & Chuẩn hóa','Nhập Excel/Folder, mapping trường dữ liệu, làm sạch và kiểm tra trùng'],
 migration:['Data Migration Dashboard','Theo dõi kiểm kê, scan, metadata, validation và chuyển đổi dữ liệu'],
 geodata:['Geo Data Center','Quản trị metadata dữ liệu địa vật lý, GIS, raw/processed data và quyền truy cập']
});
// ===== END DEMO 5.0 EXTENSION =====

// ===== DEMO 6.0 ACCOUNTING & CROSS-DEPARTMENT EXTENSION =====
Object.assign(pages,{
 accounting:['Tổng quan kế toán','Dashboard kế toán viên / kế toán trưởng'],
 vouchers:['Chứng từ kế toán','Lập, kiểm tra, hạch toán và truy vết chứng từ'],
 payments:['Thanh toán','Từ đề nghị thanh toán đến hạch toán và lưu chứng từ'],
 advances:['Tạm ứng - Hoàn ứng','Theo dõi tạm ứng, hạn hoàn ứng và chứng từ'],
 receivables:['Công nợ phải thu','Theo dõi khách hàng, hóa đơn, tuổi nợ và thu tiền'],
 payables:['Công nợ phải trả','Theo dõi nhà cung cấp, đến hạn và kế hoạch chi'],
 cashbank:['Tiền mặt & Ngân hàng','Quỹ, tài khoản ngân hàng và đối chiếu sao kê'],
 acctassets:['Tài sản kế toán','Nguyên giá, nguồn hình thành, hao mòn, tăng giảm'],
 projectacct:['Kế toán dự án','Dự toán, cam kết, thanh toán, hạch toán, quyết toán'],
 reconcile:['Đối chiếu','Ngân hàng, công nợ, tạm ứng và dữ liệu liên phân hệ'],
 closing:['Khóa sổ','Checklist khóa kỳ và kiểm soát điều chỉnh sau khóa'],
 ledgers:['Sổ kế toán','Nhật ký, sổ cái và sổ chi tiết mô phỏng'],
 acctreports:['Báo cáo kế toán','Báo cáo nghiệp vụ, quản trị và phục vụ lãnh đạo'],
 crossflow:['Luồng liên phòng','Tác vụ nối Kỹ thuật - KH-TC - Kế toán - TC-HC - Lãnh đạo'],
 handoff:['Bàn giao nghiệp vụ','Theo dõi điểm bàn giao, người nhận, SLA và hồ sơ kèm theo']
});
const _dashboardV5=render.dashboard;
render.dashboard=function(){
 if(current==='ketoan') return render.accounting();
 if(current==='ketoantruong') return render.accounting(true);
 _dashboardV5();
};
// ===== END DEMO 6.0 EXTENSION =====

// ===== DEMO 6.1 UNIFIED TASK INBOX EXTENSION =====
function myTasks(){ return D('inboxTasks').filter(t=>t.owner===current || t.cc.includes(current)); }
function ownerTasks(){ return D('inboxTasks').filter(t=>t.owner===current); }
// Badge values are computed in getShellBadges(); this just asks the topbar to re-read them.
function updateTaskBadge(){ shell.refresh(); }

function openTaskSource(id){ const t=D('inboxTasks').find(x=>x.id===id); if(!t)return; show(t.sourcePage); }

const _dashboardV61=render.dashboard;
render.dashboard=function(){
 _dashboardV61();
 const all=myTasks(), mine=ownerTasks();
 const target=document.getElementById('content'); if(!target)return;
 target.insertAdjacentHTML('afterbegin',`<div class="card" style="margin-bottom:14px"><div class="card-head"><div><h3>Việc liên quan đến tôi</h3><div class="mini">Tự động tổng hợp từ tất cả phân hệ theo vai trò hiện tại.</div></div><button class="btn btn-primary" onclick="show('action')">Mở Hộp việc (${mine.length})</button></div><div class="grid four"><div class="kpi"><div class="label">Tôi chủ trì</div><div class="value">${mine.length}</div></div><div class="kpi"><div class="label">Phối hợp/CC</div><div class="value">${all.length-mine.length}</div></div><div class="kpi"><div class="label">Ưu tiên cao</div><div class="value">${all.filter(t=>t.priority==='Cao').length}</div></div><div class="kpi"><div class="label">Quá hạn</div><div class="value">${all.filter(t=>t.overdue).length}</div></div></div><table style="margin-top:10px"><tr><th>Mã</th><th>Nội dung</th><th>Nguồn</th><th>SLA</th><th></th></tr>${mine.slice(0,4).map(t=>`<tr><td><b>${t.id}</b></td><td>${t.title}</td><td>${t.source}</td><td><span class="badge ${t.overdue?'b-danger':'b-info'}">${t.sla}</span></td><td><button class="btn btn-light" onclick="taskInboxDetail('${t.id}')">Xử lý</button></td></tr>`).join('')||'<tr><td colspan="5" class="mini">Không có tác vụ cần xử lý trực tiếp.</td></tr>'}</table></div>`);
 updateTaskBadge();
};

// ===== END DEMO 6.1 UNIFIED TASK INBOX EXTENSION =====

// ===== DEMO 6.2 CALENDAR, PLANNING & COMMUNICATION CENTER =====
pages.today=['Hôm nay','Lịch, kế hoạch, thông báo và việc cần xử lý trong ngày'];
pages.calendar=['Sự kiện','Toàn Liên đoàn • Đơn vị • Dự án • Cá nhân'];
pages.plans=['Kế hoạch','Kế hoạch Liên đoàn → đơn vị → dự án → cá nhân'];
pages.notifications=['Trung tâm thông báo','Thông báo chung, đơn vị, nghiệp vụ và cá nhân'];





let calendarScope='all', noticeFilter='all', calendarOffset=0, calendarSync=false;
// Week navigation: 0 = this week; ±1 moves one week (0 resets).
function setCalendarWeek(step){calendarOffset=step===0?0:calendarOffset+step;render.calendar()}
function toggleCalendarSync(){calendarSync=!calendarSync;render.calendar()}
function canSeeScoped(x){
 if(x.scope==='federation') return true;
 if(current==='lanhdao') return true;
 if(x.scope==='unit') return unitCodeOf(x.unit)===roleUnitCode(current);
 if(x.scope==='project') return canSeeProject(current,D('projects').find(p=>p.id===x.project)?.unit);
 if(x.scope==='personal') return x.ownerRole===current || x.owner===current;
 return false;
}
function myEvents(){return D('calendarEvents').filter(canSeeScoped)}
function myNotices(){return noticeData().filter(canSeeScoped)}
function myPlans(){return D('plans').filter(canSeeScoped)}
function scopeLabel(s){return s==='federation'?'Toàn Liên đoàn':s==='unit'?'Đơn vị':s==='project'?'Dự án':'Cá nhân'}
function scopeBadge(s){return s==='federation'?'b-info':s==='unit'?'b-ok':s==='project'?'b-warn':'b-purple'}
function updateCommBadges(){ shell.refresh(); }
// Inline handlers used to assign these globals directly; module scope needs setters.
function setCalendarScope(s){calendarScope=s;render.calendar()}
function setNoticeFilter(f){noticeFilter=f;render.notifications()}

function eventDetail(id){
 const e=D('calendarEvents').find(x=>x.id===id);if(!e)return;
 openModal(`Lịch • ${escapeHtml(e.title)}`,`<div class="grid twoeq"><div><div class="metric"><span>Ngày</span><b>${e.date}</b></div><div class="metric"><span>Thời gian</span><b>${e.time}</b></div><div class="metric"><span>Phạm vi</span><b>${scopeLabel(e.scope)}</b></div><div class="metric"><span>Đơn vị</span><b>${escapeHtml(e.unit||'-')}</b></div><div class="metric"><span>Dự án</span><b>${escapeHtml(e.project||'-')}</b></div></div><div><h3>Nội dung</h3><p>${escapeHtml(e.note)}</p><div class="toolbar"><button class="btn btn-primary" onclick="closeModal();show('${e.link}')">Mở nghiệp vụ liên quan</button><button class="btn btn-light" onclick="eventReminder('${e.id}')">Tạo nhắc việc</button></div></div></div>`)
}
function readNotice(id){const n=D('notices').find(x=>x.id===id);if(n&&!(n.readBy||[]).includes(current))save('notices',{...n,readBy:[...(n.readBy||[]),current]});return n}
function markNotice(id){readNotice(id);updateCommBadges();render.notifications();}
function openNotice(id){const n=readNotice(id);if(!n)return;updateCommBadges();openModal(n.title,`<p>${n.body}</p><div class="metric"><span>Phạm vi</span><b>${scopeLabel(n.scope)}</b></div><div class="metric"><span>Thời điểm</span><b>${n.time}</b></div><div class="metric"><span>Mức ưu tiên</span><b>${n.priority}</b></div><div class="toolbar" style="margin-top:12px"><button class="btn btn-primary" onclick="closeModal();show('${n.link}')">Mở nội dung liên quan</button><button class="btn btn-light" onclick="closeModal();render.notifications()">Đánh dấu đã đọc</button></div>`)}

render.today=function(){
 const ev=myEvents().filter(x=>x.date===todayVN()).sort((a,b)=>a.time.localeCompare(b.time));
 const notices=myNotices().filter(x=>!x.read).slice(0,5); const tasks=ownerTasks().slice(0,5);
 document.getElementById('content').innerHTML=`<div class="grid kpis"><div class="kpi"><div class="label">Lịch hôm nay</div><div class="value">${ev.length}</div><div class="sub">Cuộc họp / mốc / công tác</div></div><div class="kpi"><div class="label">Việc cần xử lý</div><div class="value">${tasks.length}</div><div class="sub">Theo Unified Task Inbox</div></div><div class="kpi"><div class="label">Thông báo chưa đọc</div><div class="value">${myNotices().filter(x=>!x.read).length}</div><div class="sub">Theo đúng phạm vi của bạn</div></div><div class="kpi"><div class="label">Kế hoạch đang theo dõi</div><div class="value">${myPlans().length}</div><div class="sub">Liên đoàn / đơn vị / dự án / cá nhân</div></div></div><div class="comm-top" style="margin-top:14px"><div class="card"><div class="card-head"><h3>Lịch hôm nay • ${todayVN()}</h3><button class="btn btn-light" onclick="show('calendar')">Mở lịch</button></div>${ev.map(e=>`<div class="agenda-item"><div class="agenda-time">${e.time}</div><div><b>${escapeHtml(e.title)}</b><div class="mini">${scopeLabel(e.scope)} • ${escapeHtml(e.project!=='-'?e.project:e.unit)}</div></div><button class="btn btn-light" onclick="eventDetail('${e.id}')">Mở</button></div>`).join('')||'<div class="mini">Không có lịch hôm nay.</div>'}</div><div class="card"><div class="card-head"><h3>Thông báo mới</h3><button class="btn btn-light" onclick="show('notifications')">Xem tất cả</button></div>${notices.map(n=>`<div class="notice-item ${n.read?'':'notice-unread'}" onclick="openNotice('${n.id}')"><b>${n.title}</b><div class="mini">${n.body}</div><div class="notice-meta">${scopeLabel(n.scope)} • ${n.time}</div></div>`).join('')}</div></div><div class="grid twoeq" style="margin-top:14px"><div class="card"><div class="card-head"><h3>Việc cần xử lý</h3><button class="btn btn-primary" onclick="show('action')">Mở Hộp việc</button></div><table><tr><th>Mã</th><th>Nội dung</th><th>SLA</th></tr>${tasks.map(t=>`<tr><td><b>${t.id}</b></td><td>${t.title}</td><td><span class="badge ${t.overdue?'b-danger':'b-info'}">${t.sla}</span></td></tr>`).join('')||'<tr><td colspan="3">Không có việc trực tiếp.</td></tr>'}</table></div><div class="card"><div class="card-head"><h3>Kế hoạch sắp tới</h3><button class="btn btn-light" onclick="show('plans')">Mở kế hoạch</button></div>${myPlans().slice(0,4).map(p=>`<div class="metric"><span>${p.title}<br><small>${p.period}</small></span><b>${p.progress}%</b></div>`).join('')}</div></div>`;
};

render.calendar=function(){
 let events=myEvents(); if(calendarScope!=='all')events=events.filter(x=>x.scope===calendarScope);
 const wk=calendarWeek(todayIso(),calendarOffset); const days=wk.days;
 if(calendarSync){const mine=workflowStore.items().filter(x=>x.type!=='payment'&&(x.owner===current||(x.cc||[]).includes(current))&&x.status!=='Hoàn thành'); events=events.concat(mine.map(x=>({id:x.id,date:vnDate(x.due),time:'23:59',title:'Hạn: '+x.title,scope:'personal',link:'directives',work:true})));}
 document.getElementById('content').innerHTML=`<div class="calendar-layout"><div class="card"><div class="card-head"><h3>Bộ lọc lịch</h3><button class="btn btn-primary" onclick="addEventModal()">+ Tạo lịch</button></div><div><span class="scope-chip ${calendarScope==='all'?'active':''}" onclick="setCalendarScope('all')">Tất cả</span><span class="scope-chip ${calendarScope==='federation'?'active':''}" onclick="setCalendarScope('federation')">Liên đoàn</span><span class="scope-chip ${calendarScope==='unit'?'active':''}" onclick="setCalendarScope('unit')">Đơn vị</span><span class="scope-chip ${calendarScope==='project'?'active':''}" onclick="setCalendarScope('project')">Dự án</span><span class="scope-chip ${calendarScope==='personal'?'active':''}" onclick="setCalendarScope('personal')">Cá nhân</span></div><div style="margin-top:14px"><h3>Chú thích</h3><div class="metric"><span>Toàn Liên đoàn</span><span class="badge b-info">Chung</span></div><div class="metric"><span>Phòng/đơn vị</span><span class="badge b-ok">Đơn vị</span></div><div class="metric"><span>Dự án</span><span class="badge b-warn">Dự án</span></div><div class="metric"><span>Cá nhân</span><span class="badge b-purple">Riêng</span></div></div><div style="margin-top:14px"><button class="btn btn-light" style="width:100%" onclick="toggleCalendarSync()">${calendarSync?'✓ Đang hiện hạn công việc':'↔ Hiện hạn công việc của tôi'}</button></div></div><div><div class="card-head"><div><h3>${wk.label}</h3><div class="mini">Hiển thị theo quyền của ${roles[current].title}</div></div><div class="toolbar"><button class="btn btn-light" onclick="setCalendarWeek(-1)">← Tuần trước</button><button class="btn btn-light" onclick="setCalendarWeek(0)">Tuần này</button><button class="btn btn-light" onclick="setCalendarWeek(1)">Tuần sau →</button></div></div><div class="calendar-grid">${days.map(d=>`<div class="cal-head">${d.slice(0,5)}</div>`).join('')}${days.map(d=>{const full=d;const es=events.filter(e=>e.date===full).sort((a,b)=>a.time.localeCompare(b.time));return `<div class="cal-day"><div class="date">${d.slice(0,5)}</div>${es.map(e=>`<div class="cal-event ${e.scope==='unit'?'unit':e.scope==='project'?'project':e.scope==='personal'?'personal':''}" onclick="${e.work?`wfOpen('${e.id}')`:`eventDetail('${e.id}')`}"><b>${e.time}</b> ${escapeHtml(e.title)}<div class="mini">${scopeLabel(e.scope)}</div></div>`).join('')}</div>`}).join('')}</div></div></div><div class="card" style="margin-top:14px"><h3>Danh sách lịch & mốc liên quan</h3><table><tr><th>Ngày</th><th>Giờ</th><th>Nội dung</th><th>Phạm vi</th><th>Đơn vị / Dự án</th><th>Liên kết</th></tr>${events.map(e=>`<tr><td>${e.date}</td><td>${e.time}</td><td><b>${escapeHtml(e.title)}</b></td><td><span class="badge ${scopeBadge(e.scope)}">${scopeLabel(e.scope)}</span></td><td>${escapeHtml(e.project!=='-'?e.project:e.unit)}</td><td><button class="btn btn-light" onclick="eventDetail('${e.id}')">Mở</button></td></tr>`).join('')}</table></div>`;
};

render.plans=function(){
 const ps=myPlans();
 document.getElementById('content').innerHTML=`<div class="grid kpis"><div class="kpi"><div class="label">Kế hoạch Liên đoàn</div><div class="value">${ps.filter(x=>x.level==='Liên đoàn').length}</div><div class="sub">Mục tiêu cấp cao</div></div><div class="kpi"><div class="label">Kế hoạch đơn vị</div><div class="value">${ps.filter(x=>x.level==='Đơn vị').length}</div><div class="sub">Theo phòng/đơn vị</div></div><div class="kpi"><div class="label">Kế hoạch dự án</div><div class="value">${ps.filter(x=>x.level==='Dự án').length}</div><div class="sub">Gắn milestone và WBS</div></div><div class="kpi"><div class="label">Kế hoạch cá nhân</div><div class="value">${ps.filter(x=>x.level==='Cá nhân').length}</div><div class="sub">Sinh đầu việc cá nhân</div></div></div><div class="grid two" style="margin-top:14px"><div class="card"><div class="card-head"><h3>Cây kế hoạch liên thông</h3><button class="btn btn-primary" onclick="addPlanModal()">+ Tạo kế hoạch</button></div><div class="plan-tree">${ps.map(p=>`<div class="plan-node"><div class="card-head"><div><b>${p.id} • ${p.title}</b><div class="mini">${p.level} • ${p.period} • Chủ trì: ${p.owner}</div></div><span class="badge ${p.status==='Có nguy cơ'?'b-danger':'b-info'}">${p.status}</span></div><div class="progress"><i style="width:${p.progress}%"></i></div><div class="mini" style="margin-top:5px">Tiến độ ${p.progress}% • Kế hoạch cấp trên: ${p.parent}</div></div>`).join('')}</div></div><div class="card"><h3>Nguyên tắc quản trị kế hoạch</h3><div class="alert"><span class="dot blue"></span><div><b>Kế hoạch cấp trên → cấp dưới</b><div class="mini">Mục tiêu Liên đoàn được phân rã xuống đơn vị, dự án và cá nhân.</div></div></div><div class="alert"><span class="dot green"></span><div><b>Mỗi đầu việc có owner + deadline</b><div class="mini">Các đầu việc cần thực hiện sẽ tự sinh vào Unified Task Inbox.</div></div></div><div class="alert"><span class="dot yellow"></span><div><b>Kế hoạch gắn thực tế</b><div class="mini">So sánh Plan vs Actual vs Forecast và cảnh báo lệch kế hoạch.</div></div></div><div class="alert"><span class="dot red"></span><div><b>Thay đổi phải có phê duyệt</b><div class="mini">Điều chỉnh mục tiêu, deadline hoặc nguồn lực được ghi audit.</div></div></div></div></div><div class="card" style="margin-top:14px"><h3>Chi tiết nội dung kế hoạch</h3><table><tr><th>Kế hoạch</th><th>Cấp</th><th>Mục tiêu / đầu việc</th><th>Tiến độ</th><th>Trạng thái</th></tr>${ps.map(p=>`<tr><td><b>${p.title}</b><div class="mini">${p.id}</div></td><td>${p.level}</td><td>${p.items.join('<br>')}</td><td>${p.progress}%</td><td><span class="badge ${p.status==='Có nguy cơ'?'b-danger':'b-info'}">${p.status}</span></td></tr>`).join('')}</table></div>`;
};

render.notifications=function(){
 let ns=myNotices(); if(noticeFilter==='unread')ns=ns.filter(x=>!x.read);if(noticeFilter==='high')ns=ns.filter(x=>x.priority==='Cao');if(['federation','unit','project','personal'].includes(noticeFilter))ns=ns.filter(x=>x.scope===noticeFilter);
 document.getElementById('content').innerHTML=`<div class="grid kpis"><div class="kpi"><div class="label">Chưa đọc</div><div class="value">${myNotices().filter(x=>!x.read).length}</div><div class="sub">Thông báo liên quan đến bạn</div></div><div class="kpi"><div class="label">Ưu tiên cao</div><div class="value">${myNotices().filter(x=>x.priority==='Cao').length}</div><div class="sub">Cần chú ý</div></div><div class="kpi"><div class="label">Toàn Liên đoàn</div><div class="value">${myNotices().filter(x=>x.scope==='federation').length}</div><div class="sub">Thông tin chung</div></div><div class="kpi"><div class="label">Nghiệp vụ / cá nhân</div><div class="value">${myNotices().filter(x=>x.scope==='project'||x.scope==='personal').length}</div><div class="sub">Có thể mở thẳng hồ sơ</div></div></div><div class="grid two" style="margin-top:14px"><div class="card"><div class="card-head"><h3>Thông báo của tôi</h3><button class="btn btn-primary" onclick="publishNoticeModal()">+ Phát hành thông báo</button></div><div class="toolbar" style="margin-bottom:10px"><button class="btn btn-light" onclick="setNoticeFilter('all')">Tất cả</button><button class="btn btn-light" onclick="setNoticeFilter('unread')">Chưa đọc</button><button class="btn btn-light" onclick="setNoticeFilter('high')">Ưu tiên cao</button><button class="btn btn-light" onclick="setNoticeFilter('unit')">Đơn vị</button><button class="btn btn-light" onclick="setNoticeFilter('project')">Dự án</button></div>${ns.map(n=>`<div class="notice-item ${n.read?'':'notice-unread'}"><div class="card-head"><div><b>${n.title}</b><div class="notice-meta">${scopeLabel(n.scope)} • ${n.time}</div></div><span class="badge ${n.priority==='Cao'?'b-danger':'b-info'}">${n.priority}</span></div><div class="mini">${n.body}</div><div class="toolbar" style="margin-top:8px"><button class="btn btn-light" onclick="openNotice('${n.id}')">Mở</button>${!n.read?`<button class="btn btn-ok" onclick="markNotice('${n.id}')">Đã đọc</button>`:''}</div></div>`).join('')||'<div class="mini">Không có thông báo theo bộ lọc.</div>'}</div><div class="card"><h3>Phân loại thông báo</h3><div class="metric"><span>Thông báo chung Liên đoàn</span><b>${myNotices().filter(x=>x.scope==='federation').length}</b></div><div class="metric"><span>Phòng/đơn vị</span><b>${myNotices().filter(x=>x.scope==='unit').length}</b></div><div class="metric"><span>Dự án / nghiệp vụ</span><b>${myNotices().filter(x=>x.scope==='project').length}</b></div><div class="metric"><span>Cá nhân</span><b>${myNotices().filter(x=>x.scope==='personal').length}</b></div><h3 style="margin-top:18px">Cơ chế liên thông</h3><div class="alert"><span class="dot blue"></span><div><b>Thông báo → Hồ sơ</b><div class="mini">Bấm thông báo mở trực tiếp dự án, hợp đồng, chứng từ hoặc tác vụ.</div></div></div><div class="alert"><span class="dot green"></span><div><b>Lịch → Reminder</b><div class="mini">Nhắc trước theo cấu hình cá nhân.</div></div></div><div class="alert"><span class="dot yellow"></span><div><b>Kế hoạch → Tác vụ</b><div class="mini">Đầu việc được sinh vào Unified Task Inbox.</div></div></div></div></div>`;
 updateCommBadges();
};

const _dashboardV62=render.dashboard;
render.dashboard=function(){
 _dashboardV62();
 const target=document.getElementById('content'); if(!target)return;
 const ev=myEvents().filter(x=>x.date===todayVN()).sort((a,b)=>a.time.localeCompare(b.time));
 const unread=myNotices().filter(x=>!x.read);
 target.insertAdjacentHTML('afterbegin',`<div class="grid twoeq" style="margin-bottom:14px"><div class="card"><div class="card-head"><div><h3>Lịch & Kế hoạch hôm nay</h3><div class="mini">Tổng hợp theo phạm vi của ${roles[current].title}</div></div><button class="btn btn-light" onclick="show('today')">Mở Hôm nay</button></div>${ev.slice(0,3).map(e=>`<div class="agenda-item"><div class="agenda-time">${e.time}</div><div><b>${escapeHtml(e.title)}</b><div class="mini">${scopeLabel(e.scope)} • ${escapeHtml(e.project!=='-'?e.project:e.unit)}</div></div><button class="btn btn-light" onclick="eventDetail('${e.id}')">Mở</button></div>`).join('')||'<div class="mini">Không có lịch hôm nay.</div>'}<div class="toolbar" style="margin-top:8px"><button class="btn btn-primary" onclick="show('calendar')">📅 Xem lịch</button><button class="btn btn-light" onclick="show('plans')">Kế hoạch</button></div></div><div class="card"><div class="card-head"><div><h3>Thông báo mới</h3><div class="mini">${unread.length} thông báo chưa đọc</div></div><button class="btn btn-light" onclick="show('notifications')">Xem tất cả</button></div>${unread.slice(0,4).map(n=>`<div class="notice-item notice-unread" onclick="openNotice('${n.id}')"><b>${n.title}</b><div class="notice-meta">${scopeLabel(n.scope)} • ${n.time}</div></div>`).join('')||'<div class="mini">Không có thông báo mới.</div>'}</div></div>`);
 updateCommBadges();
};

// ===== END DEMO 6.2 =====

// ===== DEMO 7.1 ROLE-BASED WORKSPACE & COMMON TASK BOARD =====


// Common actions remain visible as a separate table in the task workspace.




// Improve dashboard title for role-specific users.
const _dashboardV71=render.dashboard;
render.dashboard=function(){
 _dashboardV71();
 const c=document.getElementById('content'); if(!c)return;
 if(current!=='lanhdao'){
  const firstHero=c.querySelector('.module-hero');
  if(firstHero){firstHero.querySelector('.hero-tag').textContent=(roles[current].unit||'Đơn vị').toUpperCase(); const h=firstHero.querySelector('h2'); if(h)h.textContent='Không gian làm việc • '+roles[current].title;}
 }
};

// ===== END DEMO 7.1 =====


// ===== DEMO 8.0 EXECUTIVE COMMAND & PERFORMANCE EXTENSION =====
pages.command=['Executive Command Center','Ra quyết định, cảnh báo chiến lược và điều hành toàn Liên đoàn'];
pages.directives=['Chỉ đạo điều hành','Giao chỉ đạo, theo dõi SLA, kết quả và minh chứng'];
pages.meetings=['Cuộc họp & Kết luận','Lịch họp, tài liệu, biên bản, kết luận và giao việc'];
pages.performance=['KPI & Performance Center','KPI Liên đoàn, đơn vị, dự án và cá nhân'];
pages.risks=['Risk & Compliance Center','Rủi ro, kiểm soát, tuân thủ và hành động khắc phục'];
pages.strategy=['Kế hoạch chiến lược','Mục tiêu năm, sáng kiến, KPI và kết quả thực hiện'];
visualMap.command=['executive-visual','Executive Command Center','Tổng hợp dữ liệu toàn Liên đoàn thành quyết định, chỉ đạo và hành động có trách nhiệm.'];
visualMap.directives=['executive-visual','Chỉ đạo điều hành','Theo dõi từ lúc lãnh đạo giao việc đến khi đơn vị báo cáo kết quả và đóng chỉ đạo.'];
visualMap.meetings=['people-visual','Cuộc họp & Kết luận','Tài liệu họp, chương trình, biên bản, kết luận và tác vụ sau họp trên một luồng thống nhất.'];
visualMap.performance=['project-visual','KPI & Performance','Đo kết quả tự động từ dữ liệu ERP thay vì nhập báo cáo lặp lại.'];
visualMap.risks=['equipment-visual','Risk & Compliance','Nhận diện rủi ro, kiểm soát, chủ sở hữu và biện pháp xử lý theo thời gian.'];
visualMap.strategy=['field-visual','Kế hoạch chiến lược','Liên kết mục tiêu năm → sáng kiến → dự án → KPI → kết quả.'];


// Add executive menu group for leadership.


function severityBadge(s){return s==='Cao'?'b-danger':s==='Trung bình'?'b-warn':'b-info'}
function directiveStatusBadge(s){return s==='Nguy cơ trễ'?'b-danger':s==='Đang thực hiện'?'b-warn':s==='Hoàn thành'?'b-ok':'b-info'}




// ===== END DEMO 8.0 =====

// ===== DEMO 10.0 - INTEGRATED VLDC ENTERPRISE MODEL =====
// Public organization/capability data below is based on information published on vatlydiachat.gov.vn.
// Operational KPIs and transaction values remain demo/simulated unless explicitly marked as public-source data.







pages.organization=['Cơ cấu & Chức năng','Cơ cấu tổ chức, chức năng, nhiệm vụ và liên kết nghiệp vụ theo website chính thức'];
pages.capability=['Năng lực Liên đoàn','Năng lực nhân sự, kinh nghiệm và nguồn lực công khai'];
pages.equipmentcatalog=['Danh mục thiết bị công khai','Danh mục máy, thiết bị địa vật lý công khai và hồ sơ quản trị ERP'];
pages.research=['KH-CN & Đổi mới','Đề tài khoa học, tiến độ và kết quả đã triển khai'];
pages.digital=['Đánh giá chuyển đổi số','Digital Adoption, Process Digitalization, Data Quality, DEX và Improvement Backlog'];
pages.units=['Không gian đơn vị','Dashboard nghiệp vụ theo từng phòng, đoàn và trung tâm'];
visualMap.organization=['people-visual','Cơ cấu tổ chức Liên đoàn','Cấu trúc điều hành, bộ máy giúp việc và các đơn vị trực thuộc bám thông tin công khai của Liên đoàn.'];
visualMap.capability=['field-visual','Năng lực Liên đoàn','Nhân lực, kinh nghiệm, thiết bị và năng lực chuyên môn phục vụ điều hành và bố trí nguồn lực.'];
visualMap.equipmentcatalog=['equipment-visual','Danh mục máy & thiết bị','Danh mục công khai được đưa vào hồ sơ tài sản kỹ thuật để quản trị vòng đời, kiểm định và điều phối.'];
visualMap.research=['project-visual','Đề tài khoa học & đổi mới','Nhân viên đăng ký đề tài, cập nhật tiến độ; đề tài đã nghiệm thu được chia sẻ cho toàn Liên đoàn.'];
visualMap.digital=['executive-visual','Digital Adoption & Transformation Center','Đo mức độ sử dụng, tương tác, số hóa quy trình, chất lượng dữ liệu, thích nghi và hiệu quả của chính hệ thống ERP.'];
visualMap.units=['people-visual','Không gian đơn vị','Mỗi đơn vị chỉ thấy đúng chức năng, tác vụ, nguồn lực, lịch, báo cáo và KPI của mình.'];








function openUnit(id){
 const u=D('orgUnits').find(x=>x.id===id)||D('orgUnits')[1];
 openModal(u.name,`<div class="grid twoeq"><div><span class="org-chip">${u.type}</span><h2>${u.name}</h2><p class="mini">${u.mission}</p><div class="metric"><span>Lãnh đạo</span><b>${u.leader}</b></div>${u.deputy?`<div class="metric"><span>Cấp phó</span><b>${u.deputy}</b></div>`:''}<div class="metric"><span>Nhân sự công khai</span><b>${u.staff}</b></div></div><div><h3>Không gian nghiệp vụ</h3><div class="folder">✓ Tác vụ & SLA</div><div class="folder">▦ Kế hoạch / nhiệm vụ</div><div class="folder">⚙ Nguồn lực / thiết bị</div><div class="folder">▤ Hồ sơ / tài liệu</div><div class="folder">▥ Báo cáo / KPI</div></div></div><h3 style="margin-top:14px">Workflow liên phòng</h3><div class="unit-workflow"><span>Tiếp nhận</span><i>→</i><span>Phân công</span><i>→</i><span>Thực hiện</span><i>→</i><span>Kiểm tra</span><i>→</i><span>Phê duyệt / Nghiệm thu</span><i>→</i><span>Báo cáo</span></div>`)
}




// Correct demo HR headline to public capability profile.

// Role-specific dashboards for actual operating units.
const _dashboardV10=render.dashboard;
render.dashboard=function(){
 _dashboardV10();
 if(hasUnitDashboard(current)) document.getElementById('content').innerHTML=unitDashboardHtml(current);
};

// ===== END DEMO 10.0 =====


// ===== React shell API =====
export type Role = { name: string; title: string; unit: string; avatar: string };

export function getRoles(): Record<string, Role> { return roles; }
export function getPageMeta(p: string): [string, string] | undefined { return pages[p]; }
export function hasPage(p: string): boolean { return typeof render[p] === 'function'; }
export function renderPage(p: string) { currentPage = p; render[p](); addVisualHero(p); }
export function getShellBadges() {
 const shared = workflowBadges(current);
 const tasks = ownerTasks().filter(t => !['Hoàn thành', 'Đã duyệt'].includes(t.status)).length + shared.tasks;
 const notices = myNotices().filter(x => !x.read).length + shared.notices;
 const events = myEvents().filter(x => x.date === todayVN()).length;
 return {
  tasks: { count: tasks, cls: tasks ? 'b-danger' : 'b-ok' },
  notices: { count: notices, cls: notices ? 'b-danger' : 'b-ok' },
  events: { count: events, cls: events ? 'b-info' : 'b-ok' }
 };
}

// Functions referenced from inline on* attributes inside the HTML templates.
Object.assign(window, {
 render, show, openModal, closeModal, tab, aiFill, aiRun, toggleAiSource, openTaskSource, eventDetail, markNotice, openNotice, setCalendarScope, setNoticeFilter, openUnit, setCalendarWeek, toggleCalendarSync
});

// Shared cross-account workflow (directives, delegated tasks, payment dossiers) backed by Firestore.
// Business pages rebuilt on Firestore data (projects, finance, equipment, hr, risks, command, ...).
installDataPages(render, { role: () => current });
installAccountingPages(render, { role: () => current, openModal });
installKnowledgePages(render, { role: () => current, openModal, closeModal });
installActions({ role: () => current, openModal, closeModal });
installInboxPage(render, { role: () => current });
installPlansPage(render, { role: () => current, openModal, closeModal });
installNewsPage(render, { role: () => current, perms: workflowPerms, openModal, closeModal });
installCapabilityPage(render, { openModal });
installDocAssign({ role: () => current, openModal, closeModal });
installSciencePage(render, { role: () => current, openModal, closeModal });
installWorkflow(render, { show, openModal, closeModal });
