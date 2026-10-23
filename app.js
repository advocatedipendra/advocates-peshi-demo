(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const state = {
    user: null, csrf: '', demo: false, page: 'overview',
    cases: [], hearings: [], tasks: [], users: [], members: [], courts: [], requests: [], organizations: [],
  };
  const roleNames = { superadmin: 'सुपर एडमिन', admin: 'एडमिन', user: 'सदस्य' };
  const pageNames = { overview: 'अवलोकन', cases: 'मुद्दा व्यवस्थापन', hearings: 'पेशी तालिका', tasks: 'कार्य तथा समयसीमा', users: 'टोली सदस्य', courts: 'अदालत तथा निकाय', requests: 'मेटाउने अनुरोध' };
  const partyRoles = ['निवेदक','पुनरावेदक','वादी','प्रतिवादी','प्रत्यर्थी','लिखित जवाफ प्रस्तुतकर्ता','अन्य'];
  const hearingStatuses = ['scheduled','postponed','order','verdict','sentencing','completed'];
  const hearingLabels = { scheduled: 'तोकिएको', postponed: 'पेशी सरेको', order: 'आदेश', verdict: 'फैसला', sentencing: 'सजाय निर्धारण', completed: 'सम्पन्न' };
  const statusText = { pending: 'पेन्डिङ', approved: 'स्वीकृत', rejected: 'अस्वीकृत', none: 'छैन', scheduled: 'तोकिएको', postponed: 'पेशी सरेको', order: 'आदेश', verdict: 'फैसला', sentencing: 'सजाय निर्धारण', completed: 'सम्पन्न', 'शुरु':'शुरु', 'सुचारु':'सुचारु', 'सम्पन्न':'सम्पन्न' };
  const forms = {
    cases: [
      { name: 'title', label: 'मुद्दाको नाम', required: true, wide: true },
      { name: 'case_number', label: 'केस नम्बर' }, { name: 'court_id', label: 'अदालत / न्यायिक निकाय', type: 'court' },
      { name: 'filed_bs', label: 'दर्ता मिति (वि.सं.)', type: 'date' }, { name: 'status', label: 'मुद्दाको अवस्था', options: ['चलिरहेको','फैसला भएको','मुल्तबी','सम्पन्न','अन्य'] },
      { name: 'party_name', label: 'पक्षको नाम', required: true }, { name: 'party_role', label: 'पक्षको हैसियत', options: partyRoles },
      { name: 'party_address', label: 'पक्षको ठेगाना' }, { name: 'party_email', label: 'पक्षको इमेल', type: 'email' }, { name: 'party_phone', label: 'पक्षको मोबाइल' },
      { name: 'opponent_name', label: 'विपक्षीको नाम', required: true }, { name: 'opponent_role', label: 'विपक्षीको हैसियत', options: partyRoles },
      { name: 'opponent_address', label: 'विपक्षीको ठेगाना' }, { name: 'opponent_email', label: 'विपक्षीको इमेल', type: 'email' }, { name: 'opponent_phone', label: 'विपक्षीको मोबाइल' },
      { name: 'next_hearing_bs', label: 'आगामी पेशी (वि.सं.)', type: 'date' },
      { name: 'witness_notes', label: 'साक्षी / बकपत्र विवरण', type: 'textarea', wide: true },
      { name: 'evidence_notes', label: 'प्रमाण तथा प्रमाणको प्रकृति', type: 'textarea', wide: true },
      { name: 'latest_order', label: 'पछिल्लो आदेश', type: 'textarea', wide: true }, { name: 'verdict', label: 'फैसला / परिणाम', type: 'textarea', wide: true },
      { name: 'organization_id', label: 'संस्था / फर्म', type: 'organization', showSuper: true },
    ],
    hearings: [
      { name: 'hearing_bs', label: 'पेशी मिति (वि.सं.)', type: 'date', required: true }, { name: 'case_id', label: 'सम्बन्धित मुद्दा', type: 'case' },
      { name: 'court_id', label: 'अदालत / न्यायिक निकाय', type: 'court' }, { name: 'case_number', label: 'केस नम्बर' },
      { name: 'party_name', label: 'पक्षको नाम' }, { name: 'opponent_name', label: 'विपक्षीको नाम' },
      { name: 'case_title', label: 'मुद्दाको नाम' }, { name: 'status', label: 'पेशीको अवस्था', options: hearingStatuses.map((s) => hearingLabels[s]), values: hearingStatuses },
      { name: 'lawyers', label: 'कानून व्यवसायीको नाम' }, { name: 'lawyer_certificate', label: 'प्रमाणपत्र नम्बर' },
      { name: 'postponement_reason', label: 'पेशी सर्नुको कारण', type: 'textarea', wide: true },
      { name: 'order_details', label: 'आदेशको विवरण', type: 'textarea', wide: true },
      { name: 'verdict_details', label: 'फैसलाको परिणाम', type: 'textarea', wide: true },
      { name: 'sentencing_bs', label: 'सजाय निर्धारण मिति (वि.सं.)', type: 'date' }, { name: 'notes', label: 'कैफियत', type: 'textarea', wide: true },
      { name: 'organization_id', label: 'संस्था / फर्म', type: 'organization', showSuper: true },
    ],
    tasks: [
      { name: 'title', label: 'गर्नुपर्ने कार्य', required: true, wide: true }, { name: 'kind', label: 'कार्यको प्रकृति', options: ['म्याद / हदम्याद','कागजात तयारी','अदालतमा उपस्थित','ग्राहक भेटघाट','अनुसन्धान','अन्य'] },
      { name: 'status', label: 'अवस्था', options: ['शुरु','सुचारु','सम्पन्न'] }, { name: 'start_bs', label: 'सुरु मिति (वि.सं.)', type: 'date' },
      { name: 'due_bs', label: 'समयसीमा (वि.सं.)', type: 'date' }, { name: 'assigned_to', label: 'जिम्मेवार सदस्य', type: 'member' },
      { name: 'party_name', label: 'पक्षको नाम' }, { name: 'opponent_name', label: 'विपक्षीको नाम' },
      { name: 'description', label: 'कार्य विवरण', type: 'textarea', wide: true },
      { name: 'completed_bs', label: 'सम्पन्न मिति (वि.सं.)', type: 'date' },
      { name: 'completed_on_time', label: 'समयसीमाभित्र सम्पन्न', options: ['सम्पन्न भएपछि छान्नुहोस्','हो','होइन'], values: ['',1,0] },
      { name: 'extension_requested_bs', label: 'म्याद थपको अनुरोध मिति (वि.सं.)', type: 'date' },
      { name: 'extension_reason', label: 'म्याद थपको कारण', type: 'textarea', wide: true },
      { name: 'priority', label: 'समयसीमा प्राथमिकता', type: 'checkbox' },
      { name: 'organization_id', label: 'संस्था / फर्म', type: 'organization', showSuper: true },
    ],
    users: [
      { name: 'name', label: 'पूरा नाम', required: true }, { name: 'email', label: 'इमेल ठेगाना', type: 'email', required: true },
      { name: 'role', label: 'भूमिका', options: ['user','admin'], labels: ['सदस्य','एडमिन'] },
      { name: 'status', label: 'खाता अवस्था', options: ['active','pending','disabled'], labels: ['सक्रिय','सक्रिय गर्न बाँकी','निष्क्रिय'] },
      { name: 'organization_id', label: 'संस्था / फर्म', type: 'organization', showSuper: true },
      { name: 'new_organization', label: 'नयाँ संस्था / फर्मको नाम', showAdminCreate: true },
    ],
    courts: [
      { name: 'name', label: 'अदालत / निकायको नाम', required: true }, { name: 'category', label: 'प्रकार', options: ['सर्वोच्च अदालत','उच्च अदालत','जिल्ला अदालत','विशेष अदालत','न्यायाधिकरण','न्यायिक निकाय','अन्य'] },
      { name: 'location', label: 'स्थान' }, { name: 'active', label: 'सूचीमा देखाउने', options: ['सक्रिय','निष्क्रिय'], values: [1,0] },
    ],
  };
  const columns = {
    cases: [['title','मुद्दा'],['case_number','केस नम्बर'],['party_name','पक्ष'],['opponent_name','विपक्षी'],['court_name','अदालत'],['next_hearing_bs','आगामी पेशी'],['status','अवस्था']],
    hearings: [['hearing_bs','मिति'],['party_name','पक्ष विरुद्ध विपक्षी'],['case_title','मुद्दा'],['court_name','अदालत'],['lawyers','कानून व्यवसायी'],['status','अवस्था']],
    tasks: [['title','कार्य'],['kind','प्रकृति'],['assigned_name','जिम्मेवार'],['due_bs','समयसीमा'],['status','अवस्था'],['extension_status','म्याद थप']],
    users: [['name','नाम'],['email','इमेल'],['role','भूमिका'],['status','खाता']],
    courts: [['name','अदालत / निकाय'],['category','प्रकार'],['location','स्थान'],['active','स्थिति']],
    requests: [['entity_type','अभिलेख'],['entity_id','ID'],['requester','अनुरोधकर्ता'],['reason','कारण'],['created_at','अनुरोध गरिएको']],
  };
  const sectionCopy = {
    cases: ['मुद्दाको अभिलेख','पक्ष, विपक्षी, अदालत र प्रमाण सहितका मुद्दा व्यवस्थित गर्नुहोस्।'],
    hearings: ['पेशी तालिका','तोकिएको पेशी, सरेको मिति, आदेश र फैसलाको विवरण राख्नुहोस्।'],
    tasks: ['कार्य तथा समयसीमा','टोलीका कार्य र म्याद/हदम्यादलाई प्राथमिकतासहित व्यवस्थापन गर्नुहोस्।'],
    users: ['टोली सदस्य','आफ्नो संस्थाका सदस्यको भूमिका र खाता सक्रियता व्यवस्थापन गर्नुहोस्।'],
    courts: ['अदालत तथा निकाय','अदालत वा न्यायिक निकायको नाम, स्थान वा सक्रियता अद्यावधिक गर्नुहोस्।'],
    requests: ['मेटाउने अनुरोध','सदस्यले मेटाउन पठाएका अभिलेखहरू समीक्षा गर्नुहोस्।'],
  };
  const demoData = {
    cases: [
      { id:1,title:'सम्झौता कार्यान्वयन सम्बन्धी मुद्दा',case_number:'०८१-CV-००४२',party_name:'अनिता श्रेष्ठ',opponent_name:'हिमालय ट्रेडिङ प्रा.लि.',court_name:'काठमाडौं जिल्ला अदालत',next_hearing_bs:'२०८३-०७-०८',status:'चलिरहेको' },
      { id:2,title:'जग्गा दर्ता बदर',case_number:'०८०-LR-०१२८',party_name:'सुरज महर्जन',opponent_name:'राजन महर्जन',court_name:'ललितपुर जिल्ला अदालत',next_hearing_bs:'२०८३-०७-१२',status:'चलिरहेको' },
      { id:3,title:'उत्प्रेषण / परमादेश',case_number:'०८२-WP-००९५',party_name:'समीरा कार्की',opponent_name:'नेपाल सरकार',court_name:'उच्च अदालत पाटन',next_hearing_bs:'२०८३-०७-१५',status:'चलिरहेको' },
    ],
    hearings: [
      { id:1,hearing_bs:'२०८३-०७-०८',party_name:'अनिता श्रेष्ठ',opponent_name:'हिमालय ट्रेडिङ',case_title:'सम्झौता कार्यान्वयन',court_name:'काठमाडौं जिल्ला अदालत',lawyers:'अधिवक्ता दीपक न्यौपाने',status:'scheduled' },
      { id:2,hearing_bs:'२०८३-०७-०९',party_name:'सुरज महर्जन',opponent_name:'राजन महर्जन',case_title:'जग्गा दर्ता बदर',court_name:'ललितपुर जिल्ला अदालत',lawyers:'अधिवक्ता मञ्जु श्रेष्ठ',status:'order' },
      { id:3,hearing_bs:'२०८३-०७-१२',party_name:'समीरा कार्की',opponent_name:'नेपाल सरकार',case_title:'उत्प्रेषण / परमादेश',court_name:'उच्च अदालत पाटन',lawyers:'अधिवक्ता दीपक न्यौपाने',status:'scheduled' },
    ],
    tasks: [
      { id:1,title:'लिखित जवाफको अन्तिम मस्यौदा',kind:'कागजात तयारी',assigned_name:'अधिवक्ता मञ्जु श्रेष्ठ',due_bs:'२०८३-०७-०७',status:'सुचारु',priority:1 },
      { id:2,title:'साक्षीको बयान तयारी',kind:'अनुसन्धान',assigned_name:'अधिवक्ता दीपक न्यौपाने',due_bs:'२०८३-०७-०९',status:'शुरु',priority:1 },
      { id:3,title:'ग्राहकसँग कागजात समीक्षा',kind:'ग्राहक भेटघाट',assigned_name:'राधा अधिकारी',due_bs:'२०८३-०७-११',status:'शुरु' },
    ],
    users: [
      { id:1,name:'राधा अधिकारी',email:'radha@example.com',role:'admin',status:'active' },
      { id:2,name:'अधिवक्ता मञ्जु श्रेष्ठ',email:'manju@example.com',role:'user',status:'active' },
      { id:3,name:'अधिवक्ता दीपक न्यौपाने',email:'deepak@example.com',role:'user',status:'active' },
    ],
    members: [
      { id:1,name:'राधा अधिकारी',email:'radha@example.com',role:'admin',status:'active' },
      { id:2,name:'अधिवक्ता मञ्जु श्रेष्ठ',email:'manju@example.com',role:'user',status:'active' },
      { id:3,name:'अधिवक्ता दीपक न्यौपाने',email:'deepak@example.com',role:'user',status:'active' },
    ],
    courts: [{ id:1,name:'सर्वोच्च अदालत',category:'सर्वोच्च अदालत',location:'काठमाडौं' },{ id:2,name:'उच्च अदालत पाटन',category:'उच्च अदालत',location:'ललितपुर' }],
    requests: [],
    organizations: [{id:1,name:'हिमालय लिगल एसोसिएट्स'}],
  };
  let records = null;
  let editing = null;
  let toastTimer = null;

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' })[char]);
  }
  function nepaliDate(value) {
    return String(value ?? '').replace(/\d/g, (digit) => '०१२३४५६७८९'[Number(digit)]);
  }
  function notify(message, error = false) {
    const toast = $('#toast');
    toast.textContent = message; toast.classList.toggle('error', error); toast.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('show'), 3200);
  }
  async function api(path, options = {}) {
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    if (options.method && !['GET','HEAD'].includes(options.method)) headers['X-CSRF-Token'] = state.csrf;
    const response = await fetch(`/api/${path}`, { credentials: 'same-origin', ...options, headers });
    const data = response.status === 204 ? null : await response.json();
    if (!response.ok) throw new Error(data?.error || 'अनुरोध पूरा हुन सकेन।');
    return data;
  }
  function setDemo() {
    state.demo = true;
    state.user = { id:1, name:'राधा अधिकारी', email:'radha@example.com', role:'admin', organizationId:1 };
    records = JSON.parse(JSON.stringify(demoData));
    showWorkspace();
  }
  function goLogin() {
    state.demo = false; state.user = null; records = null;
    $('#app-shell').classList.add('hidden'); $('#auth-screen').classList.remove('hidden');
    $('#auth-screen').querySelectorAll('input').forEach((input) => { if (input.type !== 'email') input.value = ''; });
  }
  function showWorkspace() {
    $('#auth-screen').classList.add('hidden'); $('#app-shell').classList.remove('hidden');
    $('#demo-banner').classList.toggle('hidden', !state.demo);
    $('#admin-nav').classList.toggle('hidden', !['admin','superadmin'].includes(state.user.role));
    $('#workspace-name').textContent = state.demo ? 'हिमालय लिगल एसोसिएट्स' : (state.user.role === 'superadmin' ? 'सुपर एडमिन' : 'मेरो कानूनी कार्यक्षेत्र');
    $('#role-name').textContent = roleNames[state.user.role] || 'सदस्य';
    $('#user-avatar').textContent = (state.user.name || 'अ').trim().charAt(0);
    $('#welcome-line').textContent = state.demo ? 'हिमालय लिगल एसोसिएट्स' : 'तपाईंको कार्यक्षेत्र';
    $('#user-first-name').textContent = (state.user.name || 'साथी').split(' ')[0];
    $('#today-date').textContent = 'आज · नेपाल समय';
    if (!state.demo) refresh();
    render();
  }
  async function refresh() {
    try {
      const pages = ['cases','hearings','tasks'];
      await Promise.all(pages.map(async (page) => { records[page] = await api(page); }));
      if (['admin','superadmin'].includes(state.user.role)) {
        const [users,members,courts,requests] = await Promise.all([api('users'),api('members'), api('courts'), api('deletion-requests')]);
        records.users = users; records.members = members; records.courts = courts; records.requests = requests;
        if (state.user.role === 'superadmin') records.organizations = await api('organizations');
      } else {
        const [members,courts] = await Promise.all([api('members'),api('courts')]);
        records.users = members; records.members = members; records.courts = courts;
      }
      render();
      await updateStats();
    } catch (error) { notify(error.message, true); }
  }
  async function updateStats() {
    try {
      const result = await api('dashboard');
      $('#stat-cases').textContent = result.cases;
      $('#stat-hearings').textContent = records.hearings.length;
      $('#stat-tasks').textContent = records.tasks.filter((task) => task.status !== 'सम्पन्न').length;
      $('#stat-requests').textContent = result.deletionRequests;
      $('#nav-hearing-count').textContent = records.hearings.length || '';
      $('#nav-request-count').textContent = result.deletionRequests || '';
    } catch (error) { notify(error.message, true); }
  }
  function render() {
    if (!records) return;
    const hearings = [...records.hearings].sort((a,b) => String(a.hearing_bs).localeCompare(String(b.hearing_bs)));
    const tasks = [...records.tasks].sort((a,b) => Number(b.priority || 0)-Number(a.priority || 0) || String(a.due_bs || '').localeCompare(String(b.due_bs || '')));
    $('#overview-hearings').innerHTML = hearings.slice(0,4).map(hearingRow).join('') || empty('अहिले कुनै पेशी दर्ता छैन।');
    $('#overview-tasks').innerHTML = tasks.filter((task) => task.status !== 'सम्पन्न').slice(0,4).map(taskRow).join('') || empty('खुला कार्य छैन।');
    $('#stat-cases').textContent = records.cases.length;
    $('#stat-hearings').textContent = records.hearings.length;
    $('#stat-tasks').textContent = records.tasks.filter((task) => task.status !== 'सम्पन्न').length;
    $('#stat-requests').textContent = records.requests.length;
    $('#nav-hearing-count').textContent = records.hearings.length || '';
    $('#nav-request-count').textContent = records.requests.filter((item) => item.status === 'pending').length || '';
    for (const page of ['cases','hearings','tasks','users','courts','requests']) renderTable(page);
  }
  function empty(message) { return `<div class="empty">${escapeHtml(message)}</div>`; }
  function hearingRow(item) {
    return `<article class="record-row"><span class="date-chip">${escapeHtml(nepaliDate(item.hearing_bs || '—'))}</span><div class="record-main"><b>${escapeHtml(item.party_name || 'पक्ष')} विरुद्ध ${escapeHtml(item.opponent_name || 'विपक्षी')}</b><small>${escapeHtml(item.case_title || item.case_number || 'मुद्दा विवरण छैन')}</small></div><span class="court-name">${escapeHtml(item.court_name || 'अदालत उल्लेख छैन')}</span><span class="status ${escapeHtml(item.status)}">${escapeHtml(hearingLabels[item.status] || item.status)}</span><span class="lawyer">${escapeHtml(item.lawyers || '')}</span></article>`;
  }
  function taskRow(item) {
    return `<article class="task-row"><span class="task-check"></span><span><b>${item.priority ? '⚑ ' : ''}${escapeHtml(item.title)}</b><small>${escapeHtml(item.assigned_name || 'नतोकिएको')} · ${escapeHtml(item.kind || 'अन्य')}</small></span><span class="task-date">${escapeHtml(item.due_bs ? nepaliDate(item.due_bs) : 'मिति छैन')}</span></article>`;
  }
  function renderTable(page) {
    const target = $(`#page-${page}`);
    if (!target) return;
    const [heading, description] = sectionCopy[page];
    const data = [...(records[page] || [])];
    if (page === 'hearings') data.sort((a,b) => String(a.hearing_bs || '').localeCompare(String(b.hearing_bs || '')));
    if (page === 'tasks') data.sort((a,b) => Number(b.priority || 0)-Number(a.priority || 0) || String(a.due_bs || '').localeCompare(String(b.due_bs || '')));
    const addButton = page !== 'requests' && (page !== 'users' && page !== 'courts' || ['admin','superadmin'].includes(state.user.role));
    const heads = columns[page].map(([,label]) => `<th>${escapeHtml(label)}</th>`).join('');
    const rows = data.map((item) => {
      const tds = columns[page].map(([key]) => `<td>${cellValue(page,key,item)}</td>`).join('');
      return `<tr>${tds}<td><div class="table-actions">${actionButtons(page,item)}</div></td></tr>`;
    }).join('');
    target.innerHTML = `<div class="page-title-row"><div><div class="eyebrow">अभिलेख</div><h1>${escapeHtml(heading)}</h1><p>${escapeHtml(description)}</p></div>${addButton ? `<button class="button primary small" data-add="${page}">＋ नयाँ थप्नुहोस्</button>` : ''}</div><div class="table-panel"><div class="table-tools"><input type="search" data-search="${page}" placeholder="नाम, मुद्दा वा मिति खोज्नुहोस्…"><span class="muted">${data.length} अभिलेख</span></div><div class="table-wrap"><table><thead><tr>${heads}<th>कार्य</th></tr></thead><tbody>${rows || `<tr><td colspan="${columns[page].length+1}">${empty('अहिलेसम्म कुनै अभिलेख छैन।')}</td></tr>`}</tbody></table></div></div>`;
  }
  function cellValue(page,key,item) {
    const value = item[key];
    if (key === 'party_name' && page === 'hearings') return `<strong>${escapeHtml(item.party_name || 'पक्ष')} विरुद्ध ${escapeHtml(item.opponent_name || 'विपक्षी')}</strong>`;
    if (key === 'role') return escapeHtml(roleNames[value] || value || '—');
    if (key === 'status' && page === 'users') return `<span class="status ${escapeHtml(value)}">${escapeHtml(value === 'active' ? 'सक्रिय' : (value === 'pending' ? 'सक्रिय गर्न बाँकी' : 'निष्क्रिय'))}</span>`;
    if (key === 'active' && page === 'courts') return `<span class="status">${value ? 'सक्रिय' : 'निष्क्रिय'}</span>`;
    if (key === 'status' && page === 'hearings') return `<span class="status ${escapeHtml(value)}">${escapeHtml(hearingLabels[value] || value)}</span>`;
    if (key === 'extension_status') return `<span class="status ${escapeHtml(value)}">${escapeHtml(statusText[value] || value || '—')}</span>`;
    if (key === 'created_at') return escapeHtml(value ? String(value).slice(0,10) : '—');
    if (['filed_bs','next_hearing_bs','hearing_bs','sentencing_bs','start_bs','due_bs','completed_bs','extension_requested_bs'].includes(key)) return `<strong>${escapeHtml(nepaliDate(value || '—'))}</strong>`;
    return `<strong>${escapeHtml(value || '—')}</strong>`;
  }
  function actionButtons(page,item) {
    if (state.demo) return '';
    if (page === 'requests') return item.status === 'pending' ? `<button class="icon-button" data-review="${item.id}" data-status="approved" title="स्वीकृत">✓</button><button class="icon-button danger" data-review="${item.id}" data-status="rejected" title="अस्वीकृत">×</button>` : `<span class="status">${escapeHtml(statusText[item.status] || item.status)}</span>`;
    if (page === 'courts') return `<button class="icon-button" data-edit="${page}" data-id="${item.id}" title="सम्पादन">✎</button><button class="icon-button ${item.active ? 'danger' : ''}" data-court-toggle="${item.id}" data-active="${item.active ? 0 : 1}" title="${item.active ? 'निष्क्रिय गर्नुहोस्' : 'पुनः सक्रिय गर्नुहोस्'}">${item.active ? '×' : '✓'}</button>`;
    if (page === 'users') return item.id === state.user.id ? '' : `${item.status === 'pending' ? `<button class="icon-button" data-activation="${item.id}" title="सक्रियता इमेल पुनः पठाउनुहोस्">↗</button>` : ''}<button class="icon-button" data-edit="${page}" data-id="${item.id}" title="सम्पादन">✎</button><button class="icon-button danger" data-delete="${page}" data-id="${item.id}" title="खाता निष्क्रिय गर्नुहोस्">×</button>`;
    const canEdit = true;
    let buttons = canEdit ? `<button class="icon-button" data-edit="${page}" data-id="${item.id}" title="सम्पादन">✎</button>` : '';
    if (page === 'hearings' || page === 'cases' || page === 'tasks') buttons += `<button class="icon-button share" data-share="${page}" data-id="${item.id}" title="सेयर">↗</button>`;
    if (page === 'tasks' && item.extension_status === 'pending' && ['admin','superadmin'].includes(state.user.role)) buttons += `<button class="icon-button" data-extension="${item.id}" data-status="approved" title="म्याद थप स्वीकृत">✓</button><button class="icon-button danger" data-extension="${item.id}" data-status="rejected" title="म्याद थप अस्वीकृत">×</button>`;
    buttons += `<button class="icon-button danger" data-delete="${page}" data-id="${item.id}" title="मेटाउने अनुरोध">×</button>`;
    return buttons;
  }
  function renderOptions(field, selected) {
    let items = field.options || [];
    let values = field.values || items;
    if (field.type === 'court') {
      const courts = records.courts.filter((court) => court.active !== 0);
      items = ['अदालत छान्नुहोस्…', ...courts.map((court) => court.name)];
      values = ['', ...courts.map((court) => String(court.id))];
    }
    if (field.type === 'case') items = ['मुद्दा छान्नुहोस्…', ...records.cases.map((item) => `${item.title}${item.case_number ? ` · ${item.case_number}` : ''}`)], values = ['', ...records.cases.map((item) => String(item.id))];
    if (field.type === 'member') items = ['सदस्य छान्नुहोस्…', ...records.members.filter((u) => u.status === 'active').map((user) => user.name)], values = ['', ...records.members.filter((u) => u.status === 'active').map((user) => String(user.id))];
    if (field.type === 'organization') items = ['संस्था छान्नुहोस्…', ...records.organizations.map((organization) => organization.name)], values = ['', ...records.organizations.map((organization) => String(organization.id))];
    return items.map((label,index) => `<option value="${escapeHtml(values[index])}" ${String(values[index]) === String(selected ?? '') ? 'selected' : ''}>${escapeHtml(field.labels?.[index] || label)}</option>`).join('');
  }
  function fieldHtml(field, value = '') {
    if (field.showSuper && state.user.role !== 'superadmin') return '';
    if (field.showAdminCreate && state.user.role !== 'superadmin') return '';
    if (field.type === 'checkbox') return `<label class="check-label wide"><input class="field-input" name="${field.name}" type="checkbox" ${value ? 'checked' : ''}>${escapeHtml(field.label)}</label>`;
    const attrs = `${field.required ? 'required' : ''} ${field.wide ? 'class="wide"' : ''}`;
    let input;
    if (field.type === 'textarea') input = `<textarea class="field-input" name="${field.name}" rows="3" ${field.required ? 'required' : ''}>${escapeHtml(value)}</textarea>`;
    else if (field.options || ['court','case','member','organization'].includes(field.type)) input = `<select class="field-input" name="${field.name}" ${field.required ? 'required' : ''}>${renderOptions(field, value)}</select>`;
    else {
      const type = field.type === 'date' ? 'text' : (field.type || 'text');
      const dateAttrs = field.type === 'date' ? 'inputmode="numeric" pattern="[0-9०-९]{4}-[0-9०-९]{2}-[0-9०-९]{2}" placeholder="२०८३-०७-०१" title="वि.सं. YYYY-MM-DD"' : '';
      input = `<input class="field-input" name="${field.name}" type="${type}" value="${escapeHtml(value)}" ${dateAttrs} ${field.required ? 'required' : ''}>`;
    }
    return `<label class="${attrs.includes('wide') ? 'wide' : ''}">${escapeHtml(field.label)}${input}</label>`;
  }
  function openForm(page,item = null) {
    if (state.demo) return notify('पूर्वावलोकन मोडमा परिवर्तन सुरक्षित हुँदैन।');
    state.page = page;
    if (page === 'hearings') records.courts = records.courts || [];
    editing = item ? { page, id: item.id } : null;
    $('#dialog-title').textContent = item ? `${sectionCopy[page][0]} सम्पादन` : `नयाँ ${pageNames[page]}`;
    const def = forms[page] || [];
    $('#dialog-fields').innerHTML = def.map((field) => fieldHtml(field, item?.[field.name] ?? (field.name === 'status' ? (page === 'hearings' ? 'scheduled' : page === 'tasks' ? 'शुरु' : '') : ''))).join('');
    if (page === 'users') {
      const role = $('#dialog-fields [name="role"]');
      if (role && state.user.role !== 'superadmin') role.disabled = true;
      const syncOrganizationFields = () => {
        const isNewAdmin = state.user.role === 'superadmin' && role?.value === 'admin';
        $('[name="new_organization"]')?.closest('label')?.classList.toggle('hidden',!isNewAdmin);
        $('[name="organization_id"]')?.closest('label')?.classList.toggle('hidden',isNewAdmin);
      };
      role?.addEventListener('change', () => {
        syncOrganizationFields();
      });
      syncOrganizationFields();
    }
    $('#record-dialog').showModal();
  }
  function formPayload(form,page) {
    const data = {};
    for (const field of forms[page] || []) {
      if (field.showSuper && state.user.role !== 'superadmin') continue;
      const input = form.elements[field.name];
      if (!input) continue;
      if (field.type === 'checkbox') data[field.name] = input.checked ? 1 : 0;
      else data[field.name] = input.value.trim();
    }
    if (page === 'hearings') {
      const statusField = $('#dialog-fields [name="status"]');
      data.status = statusField?.value || 'scheduled';
    }
    if (page === 'users' && state.user.role !== 'superadmin') delete data.role;
    return data;
  }
  function buildShare(page,item) {
    const heading = page === 'hearings' ? 'पेशी विवरण' : page === 'cases' ? 'मुद्दा विवरण' : 'कार्य विवरण';
    const parts = page === 'hearings'
      ? [`मिति: ${item.hearing_bs || '—'}`, `मुद्दा: ${item.case_title || '—'}`, `${item.party_name || 'पक्ष'} विरुद्ध ${item.opponent_name || 'विपक्षी'}`, `अदालत: ${item.court_name || '—'}`, `अवस्था: ${hearingLabels[item.status] || item.status}`, `कैफियत: ${item.notes || '—'}`]
      : page === 'cases'
        ? [`मुद्दा: ${item.title}`, `नम्बर: ${item.case_number || '—'}`, `${item.party_name} विरुद्ध ${item.opponent_name}`, `अदालत: ${item.court_name || '—'}`, `आगामी पेशी: ${item.next_hearing_bs || '—'}`]
        : [`कार्य: ${item.title}`, `समयसीमा: ${item.due_bs || '—'}`, `जिम्मेवार: ${item.assigned_name || '—'}`, `अवस्था: ${item.status}`];
    return `Advocates & Jurists — ${heading}\n${parts.join('\n')}`;
  }

  $('#demo-open').addEventListener('click', setDemo);
  $('#demo-exit').addEventListener('click', goLogin);
  $('#logout').addEventListener('click', async () => {
    if (!state.demo) { try { await api('logout', { method:'POST', body:'{}' }); } catch (error) { notify(error.message, true); } }
    goLogin();
  });
  $('#login-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      const data = new FormData(event.currentTarget);
      const result = await api('login', { method:'POST', body:JSON.stringify({ email:data.get('email'), password:data.get('password') }) });
      state.user = result.user; state.csrf = result.csrf;
      records = { cases:[],hearings:[],tasks:[],users:[],members:[],courts:[],requests:[],organizations:[] };
      showWorkspace();
    } catch (error) { notify(error.message, true); }
  });
  $('#forgot-open').addEventListener('click', async () => {
    const email = prompt('तपाईंको खाता इमेल लेख्नुहोस्:');
    if (!email) return;
    try { const result = await api('forgot', { method:'POST', body:JSON.stringify({ email }) }); notify(result.message); }
    catch (error) { notify(error.message, true); }
  });
  $('#user-avatar').addEventListener('click', async () => {
    if (state.demo) return notify('पूर्वावलोकन मोडमा पासवर्ड परिवर्तन गर्न मिल्दैन।');
    const currentPassword = prompt('हालको पासवर्ड राख्नुहोस्:');
    if (currentPassword === null) return;
    const newPassword = prompt('नयाँ पासवर्ड राख्नुहोस् (कम्तीमा १२ अक्षर):');
    if (newPassword === null) return;
    if (newPassword !== prompt('नयाँ पासवर्ड पुनः राख्नुहोस्:')) return notify('नयाँ पासवर्ड मेल खाएन।',true);
    try {
      const result = await api('change-password',{method:'POST',body:JSON.stringify({currentPassword,newPassword})});
      state.csrf = result.csrf; notify('पासवर्ड परिवर्तन भयो।');
    } catch (error) { notify(error.message,true); }
  });
  $('#record-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const page = editing?.page || state.page;
    const data = formPayload(event.currentTarget,page);
    try {
      if (state.demo) throw new Error('पूर्वावलोकन मोडमा परिवर्तन सुरक्षित हुँदैन।');
      if (page === 'users' && editing) {
        await api(`users/${editing.id}`,{method:'PATCH',body:JSON.stringify({name:data.name,status:data.status})});
        notify('टोली सदस्यको विवरण अद्यावधिक भयो।');
      } else if (page === 'users') {
        const result = await api('users',{ method:'POST',body:JSON.stringify(data) });
        notify(result.message);
      } else if (page === 'courts' && editing) {
        await api(`courts/${editing.id}`,{method:'PATCH',body:JSON.stringify({...data,active:Number(data.active)})});
        notify('अदालतको विवरण अद्यावधिक भयो।');
      } else {
        const suffix = editing ? `/${editing.id}` : '';
        await api(`${page}${suffix}`,{ method:editing?'PATCH':'POST', body:JSON.stringify(data) });
        notify(editing ? 'विवरण अद्यावधिक भयो।' : 'नयाँ विवरण सेभ भयो।');
      }
      $('#record-dialog').close(); await refresh();
    } catch (error) { notify(error.message, true); }
  });
  document.addEventListener('click', async (event) => {
    const nav = event.target.closest('[data-page]');
    if (nav) {
      $$('.nav-item[data-page]').forEach((item) => item.classList.toggle('active', item === nav));
      state.page = nav.dataset.page;
      $$('.page').forEach((page) => page.classList.toggle('hidden', page.id !== `page-${state.page}`));
      $('#crumb-title').textContent = pageNames[state.page];
    }
    const add = event.target.closest('[data-add]');
    if (add) { state.page = add.dataset.add; openForm(state.page); }
    const edit = event.target.closest('[data-edit]');
    if (edit) openForm(edit.dataset.edit, records[edit.dataset.edit].find((item) => String(item.id) === edit.dataset.id));
    const goto = event.target.closest('[data-goto]');
    if (goto) $(`.nav-item[data-page="${goto.dataset.goto}"]`).click();
    const remove = event.target.closest('[data-delete]');
    if (remove) {
      const { id, delete:page } = remove.dataset;
      if (!confirm(page === 'users' ? 'यो सदस्य खाता हटाउन निश्चित हुनुहुन्छ?' : 'यो अभिलेख मेटाउन निश्चित हुनुहुन्छ? सदस्यको अनुरोध एडमिनले समीक्षा गर्नेछ।')) return;
      try { await api(`${page}/${id}`,{method:'DELETE',body:JSON.stringify({reason:state.user.role === 'user' ? 'प्रयोगकर्ताको मेटाउने अनुरोध' : ''})}); notify(state.user.role === 'user' ? 'मेटाउने अनुरोध एडमिनकहाँ पठाइयो।' : 'अभिलेख हटाइयो।'); await refresh(); }
      catch (error) { notify(error.message,true); }
    }
    const activation = event.target.closest('[data-activation]');
    if (activation) {
      try {
        const result = await api(`users/${activation.dataset.activation}/activation`,{method:'POST',body:'{}'});
        notify(result.message, !result.ok);
      } catch (error) { notify(error.message,true); }
    }
    const toggleCourt = event.target.closest('[data-court-toggle]');
    if (toggleCourt) {
      const court = records.courts.find((item) => String(item.id) === toggleCourt.dataset.courtToggle);
      if (!court || !confirm('यो अदालतलाई निष्क्रिय सूचीमा राख्ने? मुद्दामा भएका पुराना विवरण भने सुरक्षित रहनेछन्।')) return;
      try { await api(`courts/${court.id}`,{method:'PATCH',body:JSON.stringify({...court,active:Number(toggleCourt.dataset.active)})}); await refresh(); notify(Number(toggleCourt.dataset.active) ? 'अदालत पुनः सक्रिय गरियो।' : 'अदालत निष्क्रिय गरियो।'); }
      catch (error) { notify(error.message,true); }
    }
    const share = event.target.closest('[data-share]');
    if (share) {
      const item = records[share.dataset.share].find((row) => String(row.id) === share.dataset.id);
      if (!item) return;
      const message = buildShare(share.dataset.share,item);
      const choice = prompt('सेयर माध्यम लेख्नुहोस्: whatsapp वा email','whatsapp');
      if (!choice) return;
      if (choice.toLowerCase().startsWith('w')) window.open(`https://wa.me/?text=${encodeURIComponent(message)}`,'_blank','noopener');
      else if (choice.toLowerCase().startsWith('e')) window.location.href = `mailto:?subject=${encodeURIComponent('Advocates & Jurists')}&body=${encodeURIComponent(message)}`;
      else notify('whatsapp वा email मध्ये एक छान्नुहोस्।',true);
    }
    const extension = event.target.closest('[data-extension]');
    if (extension) {
      const task = records.tasks.find((item) => String(item.id) === extension.dataset.extension);
      try { await api(`tasks/${task.id}`,{method:'PATCH',body:JSON.stringify({extension_status:extension.dataset.status,...(extension.dataset.status === 'approved' ? {due_bs:task.extension_requested_bs} : {})})}); await refresh(); notify('म्याद थपको निर्णय सेभ भयो।'); }
      catch (error) { notify(error.message,true); }
    }
    const review = event.target.closest('[data-review]');
    if (review) {
      try { await api(`deletion-requests/${review.dataset.review}/review`,{method:'POST',body:JSON.stringify({status:review.dataset.status})}); await refresh(); notify('अनुरोध समीक्षा गरियो।'); }
      catch (error) { notify(error.message,true); }
    }
  });
  document.addEventListener('input',(event) => {
    if (!event.target.matches('[data-search]')) return;
    const query = event.target.value.toLocaleLowerCase();
    $$(`#page-${event.target.dataset.search} tbody tr`).forEach((row) => { row.classList.toggle('hidden',!row.textContent.toLocaleLowerCase().includes(query)); });
  });
  document.addEventListener('click',(event) => {
    const add = event.target.closest('#quick-add');
    if (add) {
      const page = state.page === 'overview' ? 'cases' : state.page;
      if (forms[page]) openForm(page);
    }
  });
  $('#share-overview').addEventListener('click',() => {
    const message = records?.hearings.slice(0,4).map((item,index) => `${index+1}. ${item.hearing_bs} — ${item.party_name} विरुद्ध ${item.opponent_name} · ${item.case_title}`).join('\n') || 'आज कुनै पेशी छैन।';
    window.open(`https://wa.me/?text=${encodeURIComponent(`Advocates & Jurists — आगामी पेशी\n${message}`)}`,'_blank','noopener');
  });
  (async () => {
    const params = new URLSearchParams(location.search);
    if (params.has('demo')) {
      setDemo();
      return;
    }
    try {
      const session = await fetch('/api/session',{credentials:'same-origin'}).then((response) => response.json());
      state.csrf = session.csrf || '';
      if (params.has('activate')) {
        const password = prompt('खाताको लागि कम्तीमा १२ अक्षरको नयाँ पासवर्ड राख्नुहोस्:');
        if (password) { await api('activate',{method:'POST',body:JSON.stringify({token:params.get('activate'),password})}); notify('खाता सक्रिय भयो। अब लगइन गर्नुहोस्।'); }
        history.replaceState({},'',location.pathname);
      } else if (params.has('reset')) {
        const password = prompt('कम्तीमा १२ अक्षरको नयाँ पासवर्ड राख्नुहोस्:');
        if (password) { await api('reset',{method:'POST',body:JSON.stringify({token:params.get('reset'),password})}); notify('पासवर्ड परिवर्तन भयो। अब लगइन गर्नुहोस्।'); }
        history.replaceState({},'',location.pathname);
      } else if (session.user) {
        state.user = session.user; records = {cases:[],hearings:[],tasks:[],users:[],members:[],courts:[],requests:[],organizations:[]}; showWorkspace();
      }
    } catch (error) {
      if (location.protocol !== 'file:') notify('.env र MySQL सेटिङ जाँच गर्नुहोस्; सर्भरमा जडान हुन सकेन।',true);
    }
  })();
})();
