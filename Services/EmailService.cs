using System.Net;
using System.Net.Mail;
using ChristmasGiftExchange.Models;
using Microsoft.Extensions.Options;

namespace ChristmasGiftExchange.Services;

public class EmailService : IEmailService
{
    private readonly EmailOptions _options;
    private readonly ILogger<EmailService> _logger;

    public EmailService(IOptions<EmailOptions> options, ILogger<EmailService> logger)
    {
        _options = options.Value;
        _logger = logger;
    }

    public async Task SendDrawResultAsync(GiftExchangeEvent giftEvent, Participant giver, Participant receiver)
    {
        if (!_options.Enabled || string.IsNullOrWhiteSpace(giver.Email))
        {
            return;
        }

        if (string.IsNullOrWhiteSpace(_options.SmtpHost) || string.IsNullOrWhiteSpace(_options.FromAddress))
        {
            _logger.LogWarning("Email 已啟用，但 SMTP 設定尚未完成。");
            return;
        }

        var hintText = string.IsNullOrWhiteSpace(receiver.WishlistHint)
            ? "還沒有留下特別偏好，記得悄悄觀察一下對方最近想要什麼。"
            : $"小提示：{receiver.WishlistHint}";

        using var message = new MailMessage();
        message.From = new MailAddress(_options.FromAddress, _options.FromName);
        message.To.Add(giver.Email);
        message.Subject = $"[交換禮物] {giftEvent.Name} 抽籤結果揭曉";
        message.IsBodyHtml = true;
        message.Body =
            $"""
            <div style="font-family:'Trebuchet MS',sans-serif;background:#fff7ec;padding:24px;color:#1f241f;">
                <h2 style="color:#b71f2e;">Ho Ho Ho, {giver.Name}！</h2>
                <p>你在 <strong>{giftEvent.Name}</strong> 抽到的對象是：</p>
                <p style="font-size:28px;color:#0f6a43;font-weight:700;">{receiver.Name}</p>
                <p>{hintText}</p>
                <p>活動日期：{giftEvent.EventDate:yyyy/MM/dd HH:mm}</p>
                <p>地點：{giftEvent.Location}</p>
                <p>預算：NT$ {giftEvent.Budget:N0}</p>
                <p style="margin-top:16px;">記得保守秘密，讓驚喜留到交換禮物當天。</p>
            </div>
            """;

        using var client = new SmtpClient(_options.SmtpHost, _options.SmtpPort)
        {
            EnableSsl = _options.EnableSsl
        };

        if (!string.IsNullOrWhiteSpace(_options.Username))
        {
            client.Credentials = new NetworkCredential(_options.Username, _options.Password);
        }

        await client.SendMailAsync(message);
    }
}
