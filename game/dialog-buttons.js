export function dialogButtonRole(label, title = '', secondary = false) {
  if (/^(취소|닫기|돌아가기|병영으로|보물함|상점으로|검색 초기화|준비 취소)$/.test(label)) return 'secondary';
  if (/탈퇴|해산|추방|위임/.test(label) || (label === '확인' && /탈퇴|나가기|해산|추방|위임/.test(title))) return 'danger';
  return secondary ? 'secondary' : 'primary';
}
export const dialogButtonSelector='button.action,button.selection-card';
export function styleDialogButtons(root, title) {
  root.querySelectorAll(dialogButtonSelector).forEach(button => {
    button.dataset.dialogRole = dialogButtonRole(button.textContent.trim(), title, button.matches('.secondary,.selection-card'));
  });
}
