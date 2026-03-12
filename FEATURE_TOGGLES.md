# Feature Toggles Documentation

## Baraza Module

The Baraza feature can be enabled or disabled independently of the main platform to ensure modularity and prevent failures in one feature from affecting the entire application.

### Backend Configuration

Set the `BARAZA_ENABLED` environment variable:

```bash
# Enable Baraza (default)
export BARAZA_ENABLED=true

# Disable Baraza
export BARAZA_ENABLED=false
```

When disabled:
- The Baraza API blueprint is not registered
- Health check reports Baraza module as "disabled"
- No Baraza-related database operations occur
- Platform continues to function normally without Baraza features

### Frontend Configuration

Set the `REACT_APP_BARAZA_ENABLED` or `VITE_BARAZA_ENABLED` environment variable:

```bash
# Enable Baraza (default)
export REACT_APP_BARAZA_ENABLED=true
# or for Vite
export VITE_BARAZA_ENABLED=true

# Disable Baraza
export REACT_APP_BARAZA_ENABLED=false
# or for Vite
export VITE_BARAZA_ENABLED=false
```

When disabled:
- Baraza components are not rendered
- No API calls are made to Baraza endpoints
- UI flows continue normally without Baraza sections

### Health Check Monitoring

The `/health` endpoint includes Baraza module status:

```json
{
  "status": "healthy",
  "components": {
    "baraza_module": "healthy" | "disabled" | "error: ..."
  }
}
```

### Development Notes

- Baraza is enabled by default in development
- Set to `false` in production if not ready for release
- Can be toggled without restarting the application (frontend requires rebuild)
- Database models remain available even when disabled for future migration

### Testing

To test the toggle functionality:

1. Set `BARAZA_ENABLED=false` in backend
2. Set `REACT_APP_BARAZA_ENABLED=false` in frontend
3. Verify:
   - Health check shows "disabled"
   - No Baraza UI elements appear
   - No Baraza API calls are made
   - Other platform features work normally
