import html2canvas from 'html2canvas'
// @ts-ignore - jspdf types may not be available
import { jsPDF } from 'jspdf'

export async function exportToPDF(element: HTMLElement, title: string): Promise<void> {
  // Hide elements that shouldn't be in PDF
  const elementsToHide: HTMLElement[] = []
  const originalDisplays: Map<HTMLElement, string> = new Map()

  // Hide navigation and action buttons (search in parent document if element is main)
  const nav = document.querySelector('nav')
  if (nav) {
    originalDisplays.set(nav, nav.style.display)
    nav.style.display = 'none'
    elementsToHide.push(nav)
  }

  // Hide checkboxes and their labels
  const checkboxes = element.querySelectorAll('input[type="checkbox"]')
  checkboxes.forEach((checkbox) => {
    const el = checkbox as HTMLElement
    originalDisplays.set(el, el.style.display)
    el.style.display = 'none'
    elementsToHide.push(el)
    
    const label = element.querySelector(`label[for="${checkbox.id}"]`)
    if (label) {
      const labelEl = label as HTMLElement
      originalDisplays.set(labelEl, labelEl.style.display)
      labelEl.style.display = 'none'
      elementsToHide.push(labelEl)
    }
  })

  // Show comment textareas that have content
  const textareas = element.querySelectorAll('textarea')
  const textareasToShow: HTMLElement[] = []
  textareas.forEach((textarea) => {
    const el = textarea as HTMLElement
    if (textarea.value && el.classList.contains('hidden')) {
      el.classList.remove('hidden')
      textareasToShow.push(el)
    }
  })

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
      useCORS: true,
      logging: false,
    })

    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: [canvas.width, canvas.height],
    })

    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height)
    pdf.save(`${title}.pdf`)
  } finally {
    // Restore original display states
    elementsToHide.forEach((el) => {
      el.style.display = originalDisplays.get(el) || ''
    })
    textareasToShow.forEach((el) => {
      el.classList.add('hidden')
    })
  }
}

export async function exportToHTML(
  element: HTMLElement,
  title: string,
  companyName: string,
  inputs: any,
  results: any
): Promise<void> {
  try {
    // Load the original HTML file as a string
    const response = await fetch('/template.html')
    if (!response.ok) {
      throw new Error('テンプレートファイルを読み込めませんでした')
    }
    let htmlString = await response.text()

    // Helper function to replace value attribute in input elements
    const replaceInputValue = (id: string, value: number | string) => {
      const numValue = typeof value === 'number' ? value : parseFloat(String(value))
      const valueStr = String(numValue)
      
      // Replace value="old" with value="new" for the specific id
      const valueRegex = new RegExp(
        `(id="${id}"[^>]*?value=")[^"]*(")`,
        'g'
      )
      htmlString = htmlString.replace(valueRegex, `$1${valueStr}$2`)
      
      // Replace data-original-value="old" with data-original-value="new"
      const dataRegex = new RegExp(
        `(id="${id}"[^>]*?data-original-value=")[^"]*(")`,
        'g'
      )
      htmlString = htmlString.replace(dataRegex, `$1${valueStr}$2`)
      
      // Replace data-previous-value="old" with data-previous-value="new"
      const prevRegex = new RegExp(
        `(id="${id}"[^>]*?data-previous-value=")[^"]*(")`,
        'g'
      )
      htmlString = htmlString.replace(prevRegex, `$1${valueStr}$2`)
    }

    // Update title
    htmlString = htmlString.replace(
      /<title>.*?<\/title>/,
      `<title>${title}</title>`
    )
    htmlString = htmlString.replace(
      /(id="mainTitleEditable"[^>]*?>)[^<]*/,
      `$1${title}`
    )

    // Update scenario names
    const scenario1Name = inputs.s1.name || 'シナリオ 1 (ベース)'
    htmlString = htmlString.replace(
      /(id="scenario1Title"[^>]*?>)[^<]*/,
      `$1${scenario1Name}`
    )

    const scenario2Name = inputs.s2.name || 'シナリオ 2 (比較)'
    htmlString = htmlString.replace(
      /(id="scenario2Title"[^>]*?>)[^<]*/,
      `$1${scenario2Name}`
    )

    // Update common inputs
    replaceInputValue('annualAttempts', inputs.annualAttempts || 0)
    replaceInputValue('atvSuccess', inputs.atvSuccess || 0)
    replaceInputValue('atvDecline', inputs.atvDecline || 0)
    replaceInputValue('threeDSCost', inputs.threeDSCost || 0)

    // Update retry rate slider
    const retryValue = inputs.retryRate || 0
    htmlString = htmlString.replace(
      /(id="retryRate"[^>]*?value=")[^"]*(")/,
      `$1${retryValue}$2`
    )
    // Update retry rate display
    htmlString = htmlString.replace(
      /(id="retryRateValue"[^>]*?>)[^<]*(<\/span>)/,
      `$1${retryValue.toFixed(0)}%$2`
    )

    // Update scenario 1 inputs
    replaceInputValue('s1_preAuthDecline', inputs.s1.preAuthDecline || 0)
    replaceInputValue('s1_postAuthAuto', inputs.s1.postAuthAuto || 0)
    replaceInputValue('s1_postAuthManual', inputs.s1.postAuthManual || 0)
    replaceInputValue('s1_3dsUsage', inputs.s1['3dsUsage'] || 0)
    replaceInputValue('s1_3dsError', inputs.s1['3dsError'] || 0)
    replaceInputValue('s1_authRate', inputs.s1.authRate || 0)
    replaceInputValue('s1_chargebackRate', inputs.s1.chargebackRate || 0)
    replaceInputValue('s1_fixedFee', inputs.s1.fixedFee || 0)
    replaceInputValue('s1_percentageFee', inputs.s1.percentageFee || 0)
    replaceInputValue('s1_perTransactionCost', inputs.s1.perTransactionCost || 0)
    replaceInputValue('s1_manualReviewCost', inputs.s1.manualReviewCost || 0)

    // Update scenario 2 inputs
    replaceInputValue('s2_preAuthDecline', inputs.s2.preAuthDecline || 0)
    replaceInputValue('s2_postAuthAuto', inputs.s2.postAuthAuto || 0)
    replaceInputValue('s2_postAuthManual', inputs.s2.postAuthManual || 0)
    replaceInputValue('s2_3dsUsage', inputs.s2['3dsUsage'] || 0)
    replaceInputValue('s2_3dsError', inputs.s2['3dsError'] || 0)
    replaceInputValue('s2_authRate', inputs.s2.authRate || 0)
    replaceInputValue('s2_chargebackRate', inputs.s2.chargebackRate || 0)
    replaceInputValue('s2_fixedFee', inputs.s2.fixedFee || 0)
    replaceInputValue('s2_percentageFee', inputs.s2.percentageFee || 0)
    replaceInputValue('s2_perTransactionCost', inputs.s2.perTransactionCost || 0)
    replaceInputValue('s2_manualReviewCost', inputs.s2.manualReviewCost || 0)

    // Update checkboxes
    const updateCheckbox = (id: string, checked: boolean) => {
      const checkboxRegex = new RegExp(`(id="${id}"[^>]*?)(\\s+checked="checked")?(>)`, 'g')
      if (checked) {
        // Ensure checked attribute is present
        htmlString = htmlString.replace(checkboxRegex, (match, p1, p2, p3) => {
          return p2 ? match : `${p1} checked="checked"${p3}`
        })
      } else {
        // Remove checked attribute
        htmlString = htmlString.replace(checkboxRegex, `$1$3`)
      }
    }

    updateCheckbox('s1_applyToNon3DS', inputs.s1.applyToNon3DS || false)
    updateCheckbox('s2_applyToNon3DS', inputs.s2.applyToNon3DS || false)

    // Helper function to escape HTML special characters
    const escapeHtml = (text: string) => {
      const map: { [key: string]: string } = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
      }
      return text.replace(/[&<>"']/g, (m) => map[m])
    }

    // Update comments from inputs.comments or current DOM
    const updateComment = (fieldId: string) => {
      // First try to get comment from inputs.comments
      let commentValue: string | null = null
      if (inputs.comments && inputs.comments[fieldId]) {
        commentValue = inputs.comments[fieldId].trim()
      }
      
      // If not found in inputs.comments, try to get from DOM
      if (!commentValue) {
        const commentTextarea = document.getElementById(`comment-${fieldId}`) as HTMLTextAreaElement
        if (commentTextarea && commentTextarea.value.trim()) {
          commentValue = commentTextarea.value.trim()
        }
      }
      
      if (commentValue) {
        const escapedComment = escapeHtml(commentValue)
        // Replace the textarea content (handle multiline content)
        const commentRegex = new RegExp(
          `(id="comment-${fieldId}"[^>]*?>)[\\s\\S]*?(<\\/textarea>)`,
          'g'
        )
        htmlString = htmlString.replace(commentRegex, `$1${escapedComment}$2`)
        
        // Remove 'hidden' class if present to show the comment
        htmlString = htmlString.replace(
          new RegExp(`(id="comment-${fieldId}"[^>]*?class="[^"]*?)\\bhidden\\b([^"]*")`, 'g'),
          `$1$2`
        )
        
        // Add 'active' class to the comment icon if not already present
        const iconRegex = new RegExp(
          `(data-comment-for="${fieldId}"[^>]*?class=")([^"]*?)(")`,
          'g'
        )
        htmlString = htmlString.replace(iconRegex, (match, p1, p2, p3) => {
          if (p2.includes('active')) {
            return match
          }
          return `${p1}${p2} active${p3}`
        })
      } else {
        // If no comment, ensure textarea is empty and hidden
        htmlString = htmlString.replace(
          new RegExp(`(id="comment-${fieldId}"[^>]*?>)[\\s\\S]*?(<\\/textarea>)`, 'g'),
          `$1$2`
        )
        // Ensure 'hidden' class is present
        const hiddenRegex = new RegExp(
          `(id="comment-${fieldId}"[^>]*?class=")([^"]*?)(")`,
          'g'
        )
        htmlString = htmlString.replace(hiddenRegex, (match, p1, p2, p3) => {
          if (p2.includes('hidden')) {
            return match
          }
          return `${p1}${p2} hidden${p3}`
        })
        // Remove 'active' class from comment icon
        htmlString = htmlString.replace(
          new RegExp(`(data-comment-for="${fieldId}"[^>]*?class=")([^"]*?)\\bactive\\b([^"]*?)(")`, 'g'),
          `$1$2$3$4`
        )
      }
    }

    // Update comments for all input fields (excluding retryRate which doesn't have comment functionality)
    const fieldIds = [
      'annualAttempts',
      'atvSuccess',
      'atvDecline',
      'threeDSCost',
      's1_preAuthDecline',
      's1_postAuthAuto',
      's1_postAuthManual',
      's1_3dsUsage',
      's1_3dsError',
      's1_authRate',
      's1_chargebackRate',
      's1_fixedFee',
      's1_percentageFee',
      's1_perTransactionCost',
      's1_manualReviewCost',
      's2_preAuthDecline',
      's2_postAuthAuto',
      's2_postAuthManual',
      's2_3dsUsage',
      's2_3dsError',
      's2_authRate',
      's2_chargebackRate',
      's2_fixedFee',
      's2_percentageFee',
      's2_perTransactionCost',
      's2_manualReviewCost',
    ]

    fieldIds.forEach((fieldId) => {
      updateComment(fieldId)
    })

    // Download the file
    const blob = new Blob([htmlString], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('HTML export error:', error)
    alert(`HTMLのエクスポートに失敗しました: ${error instanceof Error ? error.message : String(error)}`)
  }
}
