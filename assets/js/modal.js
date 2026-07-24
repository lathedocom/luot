// ==========================================================================
// FILE: assets/js/modal.js
// ==========================================================================
import { escapeHtml, getRegionLabel } from './utils.js';

export function initModalEvents() {
    const modal = document.getElementById('intelligence-modal');
    const closeAction = document.querySelector('.close-modal-action');
    if(closeAction) {
        closeAction.addEventListener('click', () => modal.classList.remove('active'));
    }
    modal.addEventListener('click', (e) => { if(e.target === modal) modal.classList.remove('active'); });
    const toggleBtn = document.getElementById('toggle-sources-btn');
    const sourcesDiv = document.getElementById('modal-sources');
    const toggleIcon = document.getElementById('toggle-sources-icon');
    const toggleText = document.getElementById('toggle-sources-text');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            if (sourcesDiv.style.display === 'none') {
                sourcesDiv.style.display = 'flex';
                toggleIcon.textContent = 'visibility_off';
                toggleText.textContent = 'Ẩn danh sách nguồn báo';
            } else {
                sourcesDiv.style.display = 'none';
                toggleIcon.textContent = 'visibility';
                toggleText.textContent = 'Xem danh sách các nguồn báo chí';
            }
        });
    }
}

export function openQuickBriefsModal(quickItems, regionLabel) {
    const modalTitle = document.getElementById('modal-title');
    if (modalTitle) modalTitle.textContent = `Điểm tin nhanh - ${regionLabel}`;
    
    const reliabilityContainer = document.getElementById('modal-reliability');
    if (reliabilityContainer) reliabilityContainer.innerHTML = ''; 
    
    const miniTimelineContainer = document.getElementById('modal-mini-timeline');
    if (miniTimelineContainer) miniTimelineContainer.style.display = 'none';
    
    const sourcesContainer = document.getElementById('modal-sources');
    if (sourcesContainer) sourcesContainer.style.display = 'none';

    const toggleBtn = document.getElementById('toggle-sources-btn');
    if (toggleBtn) toggleBtn.style.display = 'none';

    let listHtml = '';
    quickItems.forEach((item, index) => {
        const timeObj = new Date(item.timestamp);
        const timeString = `${timeObj.getHours().toString().padStart(2,'0')}:${timeObj.getMinutes().toString().padStart(2,'0')} - ${timeObj.toLocaleDateString('vi-VN')}`;
        const sourceUrl = (item.sources && item.sources.length > 0) ? item.sources[0].url : '#';
        const regionLabelStr = item.regions && item.regions.length > 0 ? getRegionLabel(item.regions[0]) : 'Thế giới';
        
        const borderStyle = index === quickItems.length - 1 
            ? 'margin-bottom: 0; padding-bottom: 0;' 
            : 'margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px dashed var(--md-sys-color-outline);';

        listHtml += `
            <div style="${borderStyle}">
                <div style="font-size: 12px; opacity: 0.7; margin-bottom: 6px;">${timeString} • ${escapeHtml(regionLabelStr)}</div>
                <a href="${escapeHtml(sourceUrl)}" target="_blank" style="font-weight: 600; font-size: 16px; color: var(--md-sys-color-on-surface); text-decoration: none; display: block; margin-bottom: 6px; line-height: 1.4; transition: color 0.2s;" onmouseover="this.style.color='var(--md-sys-color-primary)'" onmouseout="this.style.color='var(--md-sys-color-on-surface)'">
                    ${escapeHtml(item.title || item.cluster_title)} <span class="material-icons-round" style="font-size: 14px; vertical-align: middle; color: var(--md-sys-color-primary);">open_in_new</span>
                </a>
                <p style="font-size: 14px; opacity: 0.8; margin: 0; line-height: 1.5;">${escapeHtml(item.short_summary)}</p>
            </div>
        `;
    });

    const modalBody = document.getElementById('modal-body');
    if (modalBody) {
        modalBody.innerHTML = `
            <div class="intelligence-box" style="background: rgba(15, 118, 110, 0.05); border-left: 4px solid var(--md-sys-color-surface-variant); padding: 16px; border-radius: 8px;">
                ${listHtml}
            </div>
        `;
    }

    const modal = document.getElementById('intelligence-modal');
    if (modal) modal.classList.add('active');
}

export function openModal(cluster) {
    try {
        const toggleBtn = document.getElementById('toggle-sources-btn');
        if (toggleBtn) toggleBtn.style.display = 'flex'; 

        const modalTitle = document.getElementById('modal-title');
        if (modalTitle) modalTitle.textContent = cluster.title || cluster.cluster_title || 'Chi tiết sự kiện';
        
        const sources = cluster.sources || [];
        const uniqueSourceNames = [...new Set(sources.map(s => s.source_name).filter(Boolean))];
        const uniqueCount = uniqueSourceNames.length; 
        const reliabilityContainer = document.getElementById('modal-reliability');
        
        if (reliabilityContainer) {
            if (uniqueCount >= 3) {
                reliabilityContainer.innerHTML = `<span class="badge bg-success"><i class="material-icons-round">verified</i> Xác thực cao (${uniqueCount} nguồn độc lập)</span>`;
            } else if (uniqueCount === 2) {
                reliabilityContainer.innerHTML = `<span class="badge bg-warning"><i class="material-icons-round">rule</i> Đang kiểm chứng (${uniqueCount} nguồn)</span>`;
            } else if (uniqueCount === 1) {
                reliabilityContainer.innerHTML = `<span class="badge bg-secondary"><i class="material-icons-round">info</i> Tin đơn lẻ (1 nguồn)</span>`;
            } else {
                reliabilityContainer.innerHTML = `<span class="badge bg-secondary"><i class="material-icons-round">smart_toy</i> AI Tổng hợp</span>`;
            }
        }
        
        const miniTimelineContainer = document.getElementById('modal-mini-timeline');
        if (miniTimelineContainer) {
            if (cluster.timeline_events && cluster.timeline_events.length > 0) {
                const recentEvents = cluster.timeline_events.slice(0, 3);
                const timelineHtml = recentEvents.map(event => `
                    <div class="mini-timeline-item">
                        <strong>${escapeHtml(event.date)}</strong>: ${escapeHtml(event.summary)}
                    </div>
                `).join('');
                miniTimelineContainer.innerHTML = `<div style="font-weight:bold; font-size: 13px; color: var(--md-sys-color-primary); margin-bottom: 8px;">TÓM TẮT DIỄN BIẾN:</div>${timelineHtml}`;
                miniTimelineContainer.style.display = 'block';
            } else {
                miniTimelineContainer.style.display = 'none';
            }
        }
        
        let bodyHtml = `<p style="margin-bottom:20px; font-size: 15px; line-height: 1.6;">${escapeHtml(cluster.detailed_summary || cluster.short_summary || '')}</p>`;
        
        const renderList = (data) => {
            if (!data) return '';
            if (Array.isArray(data)) {
                return data.map(item => `<li style="margin-bottom: 8px;">${escapeHtml(item)}</li>`).join('');
            }
            return `<li style="margin-bottom: 8px;">${escapeHtml(data)}</li>`;
        };
        
        if (cluster.significance) {
            bodyHtml += `
            <div class="intelligence-box" style="margin-top: 16px; background: rgba(59, 130, 246, 0.05); border-left: 4px solid #3b82f6; padding: 12px; border-radius: 4px;">
                <div class="intelligence-title" style="color: #3b82f6; font-weight: bold; display: flex; align-items: center; gap: 6px;">
                    <span class="material-icons-round" style="font-size: 18px;">lightbulb</span> Ý nghĩa cốt lõi
                </div>
                <p style="font-weight: 500; font-size: 14px; margin-top: 8px; margin-bottom: 0; line-height: 1.6;">${escapeHtml(cluster.significance)}</p>
            </div>`;
        }
 
        if (cluster.causes && (Array.isArray(cluster.causes) ? cluster.causes.length > 0 : true)) {
            bodyHtml += `
            <div class="intelligence-box" style="margin-top: 16px; background: rgba(245, 158, 11, 0.05); border-left: 4px solid #f59e0b; padding: 12px; border-radius: 4px;">
                <div class="intelligence-title" style="color: #f59e0b; font-weight: bold; display: flex; align-items: center; gap: 6px;">
                    <span class="material-icons-round" style="font-size: 18px;">explore</span> Căn nguyên / Bối cảnh
                </div>
                <ul style="padding-left: 20px; font-size: 14px; margin-top: 12px; margin-bottom: 0; line-height: 1.6;">
                    ${renderList(cluster.causes)}
                </ul>
            </div>`;
        }
 
        if (cluster.effects && (Array.isArray(cluster.effects) ? cluster.effects.length > 0 : true)) {
            bodyHtml += `
            <div class="intelligence-box" style="margin-top: 16px; background: rgba(239, 68, 68, 0.05); border-left: 4px solid #ef4444; padding: 12px; border-radius: 4px;">
                <div class="intelligence-title" style="color: #ef4444; font-weight: bold; display: flex; align-items: center; gap: 6px;">
                    <span class="material-icons-round" style="font-size: 18px;">bolt</span> Tác động / Ảnh hưởng
                </div>
                <ul style="padding-left: 20px; font-size: 14px; margin-top: 12px; margin-bottom: 0; line-height: 1.6;">
                    ${renderList(cluster.effects)}
                </ul>
            </div>`;
        }
        
        if (cluster.affected_groups && (Array.isArray(cluster.affected_groups) ? cluster.affected_groups.length > 0 : true)) {
            bodyHtml += `
            <div class="intelligence-box" style="margin-top: 16px; background: rgba(139, 92, 246, 0.05); border-left: 4px solid #8b5cf6; padding: 12px; border-radius: 4px;">
                <div class="intelligence-title" style="color: #8b5cf6; font-weight: bold; display: flex; align-items: center; gap: 6px;">
                    <span class="material-icons-round" style="font-size: 18px;">groups</span> Đối tượng / Nhóm bị ảnh hưởng
                </div>
                <ul style="padding-left: 20px; font-size: 14px; margin-top: 12px; margin-bottom: 0; line-height: 1.6;">
                    ${renderList(cluster.affected_groups)}
                </ul>
            </div>`;
        }
 
        if (cluster.market_impact && (Array.isArray(cluster.market_impact) ? cluster.market_impact.length > 0 : true)) {
            bodyHtml += `
            <div class="intelligence-box" style="margin-top: 16px; background: rgba(16, 185, 129, 0.05); border-left: 4px solid #10b981; padding: 12px; border-radius: 4px;">
                <div class="intelligence-title" style="color: #10b981; font-weight: bold; display: flex; align-items: center; gap: 6px;">
                    <span class="material-icons-round" style="font-size: 18px;">trending_up</span> Tác động thị trường
                </div>
                <ul style="padding-left: 20px; font-size: 14px; margin-top: 12px; margin-bottom: 0; line-height: 1.6;">
                    ${renderList(cluster.market_impact)}
                </ul>
            </div>`;
        }
        
        if (cluster.unknowns && (Array.isArray(cluster.unknowns) ? cluster.unknowns.length > 0 : true)) {
            bodyHtml += `
            <div class="intelligence-box" style="margin-top: 16px; background: rgba(107, 114, 128, 0.05); border-left: 4px solid #6b7280; padding: 12px; border-radius: 4px;">
                <div class="intelligence-title" style="color: #6b7280; font-weight: bold; display: flex; align-items: center; gap: 6px;">
                    <span class="material-icons-round" style="font-size: 18px;">help_outline</span> Điểm mờ / Cần kiểm chứng
                </div>
                <ul style="padding-left: 20px; font-size: 14px; margin-top: 12px; margin-bottom: 0; line-height: 1.6;">
                    ${renderList(cluster.unknowns)}
                </ul>
            </div>`;
        }
 
        if (cluster.scenarios && (Array.isArray(cluster.scenarios) ? cluster.scenarios.length > 0 : true)) {
            const scenariosHtml = cluster.scenarios.map(sc => {
                let color = sc.likelihood === 'cao' ? '#ef4444' : (sc.likelihood === 'trung bình' ? '#f59e0b' : '#10b981');
                return `<li style="margin-bottom: 8px;">${escapeHtml(sc.text)} <span style="color:${color}; font-weight:bold; font-size: 12px;">[Khả năng: ${escapeHtml(sc.likelihood)}]</span></li>`;
            }).join('');
            bodyHtml += `
            <div class="intelligence-box" style="margin-top: 20px; background: rgba(139, 92, 246, 0.05); border-left: 4px solid #8b5cf6; padding: 12px; border-radius: 4px;">
                <div class="intelligence-title" style="color: #8b5cf6; font-weight: bold; display: flex; align-items: center; gap: 6px;">
                    <span class="material-icons-round" style="font-size: 18px;">alt_route</span> Kịch bản tiếp theo
                </div>
                <ul style="padding-left: 20px; font-size: 14px; margin-top: 12px; margin-bottom: 0; line-height: 1.6;">
                    ${scenariosHtml}
                </ul>
            </div>`;
        } else if (cluster.follow_up) {
             bodyHtml += `
             <div class="intelligence-box" style="margin-top: 20px; background: rgba(59, 130, 246, 0.05); border-left: 4px solid #3b82f6; padding: 12px; border-radius: 4px;">
                 <div class="intelligence-title" style="color: #3b82f6; font-weight: bold; display: flex; align-items: center; gap: 6px;">
                     <span class="material-icons-round" style="font-size: 18px;">radar</span> Điều cần theo dõi tiếp theo
                 </div>
                 <p style="font-weight: 500; font-size: 14px; margin-top: 8px; margin-bottom: 0; line-height: 1.6;">${escapeHtml(cluster.follow_up)}</p>
             </div>`;
        }
        
        if (cluster.confidence_note) {
            bodyHtml += `<div style="font-size: 12px; opacity: 0.7; font-style: italic; margin-top: 16px; border-top: 1px dashed var(--md-sys-color-outline); padding-top: 12px;">
                * Ghi chú AI: ${escapeHtml(cluster.confidence_note)}
            </div>`;
        }
 
        const modalBody = document.getElementById('modal-body');
        if (modalBody) modalBody.innerHTML = bodyHtml;
        
        const sourcesContainer = document.getElementById('modal-sources');
        if (sourcesContainer) {
            sourcesContainer.innerHTML = '';
            sourcesContainer.style.display = 'none'; 
            
            if (cluster.sources && Array.isArray(cluster.sources) && cluster.sources.length > 0) {
                cluster.sources.forEach(src => {
                    sourcesContainer.innerHTML += `
                        <a href="${escapeHtml(src.url || '#')}" target="_blank" class="source-chip" style="display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; background: var(--md-sys-color-surface); border: 1px solid var(--md-sys-color-outline); border-radius: 16px; font-size: 12px; text-decoration: none; color: inherit; margin-right: 8px; margin-bottom: 8px;">
                            <img src="${escapeHtml(src.source_logo || 'https://via.placeholder.com/16')}" width="16" height="16" style="border-radius:50%; object-fit: cover; background: #fff;"> 
                            ${escapeHtml(src.source_name || 'Nguồn báo')}
                        </a>`;
                });
            }
        }
 
        const toggleIcon = document.getElementById('toggle-sources-icon');
        if (toggleIcon) toggleIcon.textContent = 'visibility';
        
        const toggleText = document.getElementById('toggle-sources-text');
        if (toggleText) toggleText.textContent = 'Xem danh sách các nguồn báo chí';
        
        const modal = document.getElementById('intelligence-modal');
        if (modal) {
            modal.classList.add('active');
        }
 
    } catch (error) {
        console.error("Đã xảy ra lỗi khi render Modal:", error);
    }
}
