export const emailTampelet = (message:any) => {
    return `
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout:fixed;background-color:#f9f9f9;" id="bodyTable">
        <tbody>
            <tr>
                <td style="padding-right:10px;padding-left:10px;" align="center" valign="top" id="bodyCell">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" class="wrapperWebview" style="max-width:600px;">
                        <tbody>
                            <tr>
                                <td align="center" valign="top">
                                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                        <tbody>
                                            <tr>
                                                <td style="padding-top: 20px; padding-bottom: 20px; padding-right: 0px;" align="right" valign="middle" class="webview"> 
                                                    <a href="#" style="color:#BBBBBB;font-family:'Open Sans',Helvetica,Arial,sans-serif;font-size:12px;font-weight:400;line-height:20px;text-align:right;text-decoration:underline;padding:0;margin:0" target="_blank" class="text hideOnMobile">
                                                        عرض في المتصفح →
                                                    </a>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" class="wrapperBody" style="max-width:600px;">
                        <tbody>
                            <tr>
                                <td align="center" valign="top">
                                    <table border="0" cellpadding="0" cellspacing="0" width="100%" class="tableCard" style="background-color:#FFFFFF;border-color:#F0F0F0;border-style:solid;border-width:0 1px 1px 1px;border-bottom-left-radius: 8px; border-bottom-right-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.05);">
                                        <tbody>
                                            <tr>
                                                <td style="background-color:#ff007f; /* Gold */ font-size:1px;line-height:3px; border-top-left-radius: 8px; border-top-right-radius: 8px;" class="topBorder" height="3">&nbsp;</td>
                                            </tr>
                                            <tr>
                                                <td style="padding-top: 40px; padding-bottom: 20px;" align="center" valign="middle" class="emailLogo">
                                                    <a href="#" style="text-decoration:none" target="_blank">
                                                        <h1 class="text" style="color:#222222;font-family:'Georgia',serif;font-size:32px;font-weight:bold;font-style:normal;letter-spacing:1px;line-height:36px;text-transform:uppercase;text-align:center;padding:0;margin:0; text-shadow: 1px 1px 2px rgba(0,0,0,0.1);">لاميع</h1>
                                                    </a>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding-bottom: 20px;" align="center" valign="top" class="imgHero">
                                                    <a href="#" style="text-decoration:none" target="_blank">
                                                        <img alt="Verify Your Account" border="0" src="https://via.placeholder.com/600x250/FFD700/FFFFFF?text=Lamee%27+Verification" style="width:100%;max-width:600px;height:auto;display:block;color: #f9f9f9;" width="600">
                                                    </a>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding-bottom: 5px; padding-left: 20px; padding-right: 20px;" align="center" valign="top" class="mainTitle">
                                                    <h2 class="text" style="color:#222222;font-family:'Poppins',Helvetica,Arial,sans-serif;font-size:28px;font-weight:600;font-style:normal;letter-spacing:normal;line-height:36px;text-transform:none;text-align:center;padding:0;margin:0;">مرحباً بك في لاميع!</h2>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding-bottom: 30px; padding-left: 20px; padding-right: 20px;" align="center" valign="top" class="subTitle">
                                                    <h4 class="text" style="color:#666666;font-family:'Open Sans',Helvetica,Arial,sans-serif;font-size:16px;font-weight:400;font-style:normal;letter-spacing:normal;line-height:24px;text-transform:none;text-align:center;padding:0;margin:0;">الرجاء استخدام الكود التالي لتأكيد حسابك:</h4>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding-left:20px;padding-right:20px" align="center" valign="top" class="containtTable ui-sortable">
                                                    <table border="0" cellpadding="0" cellspacing="0" width="100%" class="tableDescription" style="">
                                                        <tbody>
                                                            <tr>
                                                                <td style="padding-bottom: 20px;" align="center" valign="top" class="description">
                                                                    <p class="text" style="color:#666666;font-family:'Open Sans',Helvetica,Arial,sans-serif;font-size:14px;font-weight:400;font-style:normal;letter-spacing:normal;line-height:22px;text-transform:none;text-align:center;padding:0;margin:0">
                                                                        هذا الكود هو مفتاحك لتأمين حسابك والوصول إلى جميع ميزات لاميع.
                                                                    </p>
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                    <table border="0" cellpadding="0" cellspacing="0" width="100%" class="tableButton" style="">
                                                        <tbody>
                                                            <tr>
                                                                <td style="padding-top:20px;padding-bottom:20px" align="center" valign="top">
                                                                    <table border="0" cellpadding="0" cellspacing="0" align="center">
                                                                        <tbody>
                                                                            <tr>
                                                                                <td style="background-color: #ff007f; /* Gold */ padding: 15px 40px; border-radius: 50px; color: #FFFFFF; font-family:'Poppins',Helvetica,Arial,sans-serif; font-size:24px; font-weight:bold; text-align:center; text-shadow: 1px 1px 2px rgba(0,0,0,0.2); letter-spacing: 2px;" align="center" class="ctaButton">
                                                                                    ${message}
                                                                                </td>
                                                                            </tr>
                                                                        </tbody>
                                                                    </table>
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="font-size:1px;line-height:1px" height="20">&nbsp;</td>
                                            </tr>
                                            <tr>
                                                <td align="center" valign="middle" style="padding-bottom: 40px;" class="emailRegards">
                                                    <a href="#" target="_blank" style="text-decoration:none;">
                                                        <img mc:edit="signature" src="https://via.placeholder.com/150x50/F8C8DC/FFFFFF?text=Lamee%27" alt="Lamee' Signature" width="150" border="0" style="width:100%; max-width:150px; height:auto; display:block;">
                                                    </a>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                    <table border="0" cellpadding="0" cellspacing="0" width="100%" class="space">
                                        <tbody>
                                            <tr>
                                                <td style="font-size:1px;line-height:1px" height="30">&nbsp;</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" class="wrapperFooter" style="max-width:600px;">
                        <tbody>
                            <tr>
                                <td align="center" valign="top">
                                    <table border="0" cellpadding="0" cellspacing="0" width="100%" class="footer">
                                        <tbody>
                                            <tr>
                                                <td style="padding-top:10px;padding-bottom:10px;padding-left:10px;padding-right:10px" align="center" valign="top" class="socialLinks">
                                                    <a href="#facebook-link" style="display:inline-block" target="_blank" class="facebook">
                                                        <img alt="Facebook" border="0" src="https://i.imgur.com/gK9M54K.png" style="height:auto;width:100%;max-width:40px;margin-left:2px;margin-right:2px" width="40">
                                                    </a>
                                                    <a href="#twitter-link" style="display: inline-block;" target="_blank" class="twitter">
                                                        <img alt="Twitter" border="0" src="https://i.imgur.com/Xy1Q71B.png" style="height:auto;width:100%;max-width:40px;margin-left:2px;margin-right:2px" width="40">
                                                    </a>
                                                    <a href="#instagram-link" style="display: inline-block;" target="_blank" class="instagram">
                                                        <img alt="Instagram" border="0" src="https://i.imgur.com/kP8sLwM.png" style="height:auto;width:100%;max-width:40px;margin-left:2px;margin-right:2px" width="40">
                                                    </a>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 10px 10px 5px;" align="center" valign="top" class="brandInfo">
                                                    <p class="text" style="color:#999999;font-family:'Open Sans',Helvetica,Arial,sans-serif;font-size:12px;font-weight:400;line-height:20px;text-align:center;padding:0;margin:0">
                                                        ©&nbsp;لاميع. جميع الحقوق محفوظة.
                                                    </p>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 0px 10px 20px;" align="center" valign="top" class="footerLinks">
                                                    <p class="text" style="color:#999999;font-family:'Open Sans',Helvetica,Arial,sans-serif;font-size:12px;font-weight:400;line-height:20px;text-align:center;padding:0;margin:0"> 
                                                        <a href="#" style="color:#999999;text-decoration:underline" target="_blank">عرض نسخة الويب</a>&nbsp;|&nbsp; 
                                                        <a href="#" style="color:#999999;text-decoration:underline" target="_blank">إلغاء الاشتراك</a>
                                                    </p>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 0px 10px 10px;" align="center" valign="top" class="footerEmailInfo">
                                                    <p class="text" style="color:#999999;font-family:'Open Sans',Helvetica,Arial,sans-serif;font-size:12px;font-weight:400;line-height:20px;text-align:center;padding:0;margin:0">
                                                        إذا كان لديك أي أسئلة، يرجى الاتصال بنا على 
                                                        <a href="mailto:support@lamee.com" style="color:#999999;text-decoration:underline" target="_blank">support@lamee.com</a>.
                                                    </p>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="font-size:1px;line-height:1px" height="30">&nbsp;</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </td>
                            </tr>
                            <tr>
                                <td style="font-size:1px;line-height:1px" height="30">&nbsp;</td>
                            </tr>
                        </tbody>
                    </table>
                </td>
            </tr>
        </tbody>
    </table>
    `;
};

type LeaveApprovedParams = { name: string; days: number; leaveType: string };
type LeaveRejectedParams = { name: string; reason?: string };
type LoanApprovedParams = { name: string; amount: number; type: string };
type BonusApprovedParams = { name: string; amount: number };
type PayrollPaidParams = { name: string; netSalary: number; month: number; year: number };

export const emailTemplate = {
  leaveApproved: ({ name, days, leaveType }: LeaveApprovedParams) =>
    `<p>عزيزي/عزيزتي <strong>${name}</strong>،</p>
     <p>تمت الموافقة على طلب إجازتك (<strong>${leaveType}</strong>) لمدة <strong>${days}</strong> يوم/أيام.</p>
     <p>نتمنى لك إجازة سعيدة.</p>`,

  leaveRejected: ({ name, reason }: LeaveRejectedParams) =>
    `<p>عزيزي/عزيزتي <strong>${name}</strong>،</p>
     <p>نأسف لإبلاغك بأن طلب إجازتك قد <strong>رُفض</strong>.</p>
     ${reason ? `<p>السبب: ${reason}</p>` : ""}
     <p>للاستفسار، يرجى التواصل مع قسم الموارد البشرية.</p>`,

  loanApproved: ({ name, amount, type }: LoanApprovedParams) =>
    `<p>عزيزي/عزيزتي <strong>${name}</strong>،</p>
     <p>تمت الموافقة على ${type === "loan" ? "قرضك" : "سلفتك"} بمبلغ <strong>${amount}</strong>.</p>
     <p>سيتم خصم الأقساط وفق جدول السداد المعتمد.</p>`,

  bonusApproved: ({ name, amount }: BonusApprovedParams) =>
    `<p>عزيزي/عزيزتي <strong>${name}</strong>،</p>
     <p>تمت الموافقة على مكافأتك بمبلغ <strong>${amount}</strong>.</p>
     <p>ستُضاف للراتب أو تُصرف حسب نوع المكافأة المعتمد.</p>`,

  payrollPaid: ({ name, netSalary, month, year }: PayrollPaidParams) =>
    `<p>عزيزي/عزيزتي <strong>${name}</strong>،</p>
     <p>تم صرف راتب شهر <strong>${month}/${year}</strong>.</p>
     <p>صافي الراتب: <strong>${netSalary}</strong>.</p>`,
};