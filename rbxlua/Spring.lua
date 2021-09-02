--[[
class Spring

Description:
	A physical model of a spring, useful in many applications. Properties only evaluate
	upon index making this model good for lazy applications

API:
	Spring = Spring.new(number position)
		Creates a new spring in 1D
	Spring = Spring.new(Vector3 position)
		Creates a new spring in 3D

	Spring:GetPosition()
		Returns the current position
	Spring:GetVelocity()
		Returns the current velocity
	Spring:GetTarget()
		Returns the target
	Spring:GetDamper()
		Returns the damper
	Spring:GetSpeed()
		Returns the speed

	Spring:SetTarget(number/Vector3)
		Sets the target
	Spring.SetPosition(number/Vector3)
		Sets the position
	Spring.SetVelocity(number/Vector3)
		Sets the velocity
	Spring:SetDamper(number [0, 1])
		Sets the spring damper, defaults to 1
	Spring:SetSpeed(number [0, infinity))
		Sets the spring speed, defaults to 1

	Spring:TimeSkip(number DeltaTime)
		Instantly skips the spring forwards by that amount of now
	Spring:Impulse(number/Vector3 velocity)
		Impulses the spring, increasing velocity by the amount given

Visualization (by Defaultio):
	https://www.desmos.com/calculator/hn2i9shxbz
]]

-- based spring
-- this is better because it doesn't use `__index` as a function or `__newindex`, which provides a massive speed increase over the original.

local Spring = {}
Spring.__index = Spring

--- Creates a new spring
-- @param initial A number or Vector3 (anything with * number and addition/subtraction defined)
-- @param[opt=tick] clock function to use to update spring
function Spring.new(initial, clock)
	local target = initial or 0
	clock = clock or tick
	return setmetatable({
		_clock = clock;
		_time0 = clock();
		_position0 = target;
		_velocity0 = 0*target;
		_target = target;
		_damper = 1;
		_speed = 1;
	}, Spring)
end

--- Impulse the spring with a change in velocity
-- @param velocity The velocity to impulse with
function Spring:Impulse(velocity)
	return self:SetVelocity(self:GetVelocity() + velocity)
end

--- Skip forwards in now
-- @param delta now to skip forwards
function Spring:TimeSkip(delta)
	local now = self._clock()
	local position, velocity = self:_positionVelocity(now+delta)
	self._position0 = position
	self._velocity0 = velocity
	self._time0 = now
	return self
end

function Spring:GetPosition()
	return (self:_positionVelocity(self._clock()))
end

Spring.GetValue = Spring.GetPosition

function Spring:GetVelocity()
	local _, velocity = self:_positionVelocity(self._clock())
	return velocity
end

local BASIC_VALUES = {"Target", "Damper", "Speed", "Clock"}

for _, ValueName in ipairs(BASIC_VALUES) do
	local EntryName = "_" .. string.lower(ValueName)
	Spring["Get" .. ValueName] = function(self)
		return self[EntryName]
	end
end

function Spring:SetPosition(value)
	local now = self._clock()
	local _, velocity = self:_positionVelocity(now)
	self._position0 = value
	self._velocity0 = velocity
	self._time0 = now
	return self
end

Spring.SetValue = Spring.SetPosition

function Spring:SetVelocity(value)
	local now = self._clock()
	self._position0 = self:_positionVelocity(now)
	self._velocity0 = value
	self._time0 = now
	return self
end

function Spring:SetTarget(value)
	local now = self._clock()
	self._position0, self._velocity0 = self:_positionVelocity(now)
	self._target = value
	self._time0 = now
	return self
end

function Spring:SetDamper(value)
	local now = self._clock()
	self._position0, self._velocity0 = self:_positionVelocity(now)
	self._damper = math.clamp(value, 0, 1)
	self._time0 = now
	return self
end

function Spring:SetSpeed(value)
	local now = self._clock()
	self._position0, self._velocity0 = self:_positionVelocity(now)
	self._speed = value < 0 and 0 or value
	self._time0 = now
	return self
end

function Spring:SetClock(value)
	local now = self._clock()
	self._position0, self._velocity0 = self:_positionVelocity(now)
	self._clock = value
	self._time0 = value()
	return self
end

function Spring:_positionVelocity(now)
	local p0 = self._position0
	local v0 = self._velocity0
	local p1 = self._target
	local d = self._damper
	local s = self._speed

	local t = s*(now - self._time0)
	local d2 = d*d

	local h, si, co
	if d2 < 1 then
		h = math.sqrt(1 - d2)
		local ep = math.exp(-d*t)/h
		co, si = ep*math.cos(h*t), ep*math.sin(h*t)
	elseif d2 == 1 then
		h = 1
		local ep = math.exp(-d*t)/h
		co, si = ep, ep*t
	else
		h = math.sqrt(d2 - 1)
		local u = math.exp((-d + h)*t)/(2*h)
		local v = math.exp((-d - h)*t)/(2*h)
		co, si = u + v, u - v
	end

	local a0 = h*co + d*si
	local a1 = 1 - (h*co + d*si)
	local a2 = si/s

	local b0 = -s*si
	local b1 = s*si
	local b2 = h*co - d*si

	return
		a0*p0 + a1*p1 + a2*v0,
		b0*p0 + b1*p1 + b2*v0
end

return Spring
