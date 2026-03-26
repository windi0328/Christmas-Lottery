using ChristmasGiftExchange.Models;

namespace ChristmasGiftExchange.Services;

public interface IEmailService
{
    Task SendDrawResultAsync(GiftExchangeEvent giftEvent, Participant giver, Participant receiver);
}
