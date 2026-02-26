using ComWebApp.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddSingleton<IUserService, UserService>();
builder.Services.AddSingleton<IMessageService, MessageService>();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();

app.MapControllers();

app.Run();