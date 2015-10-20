<?php namespace Its123\Sdk;

/**
 * Class ApiHandler
 *
 * Example PHP class for accessing tests and products of the 123test API.
 *
 * @author Wouter Bulten
 * @author Theo den Hollander
 * @version 3.1
 * @link https://www.123test.com
 * @link https://github.com/123test/api-sdk
 * @package Its123\Sdk
 */
class ApiHandler
{
    /**
     * @var string API key
     */
    private $apiKey;

    /**
     * @var @string Client
     */
    private $apiClient;

    /**
     * @var string URL we use as endpoint
     */
    private $apiEndpoint = 'v2';

    /**
     * @var string Protocol for the requests
     */
    private $protocol = 'https';

    /**
     * @var string Default host
     */
    private $host = 'api.123test.com';

    /**
     * @var bool debug flag
     */
    private $debugMode = false;

    /**
     * @var bool Flag for checking ssl certificates
     */
    private $verifySsl = true;

    /**
     * @var string The algorithm used for encryption.
     */
    protected $cipher = MCRYPT_RIJNDAEL_128;

    /**
     *  @var string The mode used for encryption.
     */
    protected $encryptionMode = MCRYPT_MODE_CBC;

    /**
     * Instantiates a new handler to access the 123test api
     *
     * @param string $apiClient The client id
     * @param string $apiKey Secret api key
     * @param bool $debugMode Enable debug mode, not to be used in production.
     * @param bool $verifySsl Enable or disable checking of the ssl certificate
     */
    public function __construct($apiClient, $apiKey, $debugMode = false, $verifySsl = true)
    {
        $this->apiClient = $apiClient;
        $this->apiKey = $apiKey;
        $this->debugMode = $debugMode;
        $this->verifySsl = $verifySsl;
    }

    /**
     * Set the api end point to a different value
     *
     * Generally only used for testing purposes.
     * @param string $protocol http/https
     * @param string $host host endpoint
     * @param string $endpoint
     */
    public function setEndPoint($protocol, $host, $endpoint)
    {
        $this->protocol = $protocol;
        $this->host = $host;
        $this->apiEndpoint = $endpoint;
    }

    /**
     * Request access to a specific product
     * @param string $productId The id of the product
     * @param string $channel channel of your business
     * @param string[] $data of your request
     * @return Object containing the access code and session key
     * @throws \Exception
     */
    public function requestAccess(
        $productId,
        $channel = "default",
        $data = array()
    ) {
        return $this->requestAction("request-product", $channel, $productId, null, $data);
    }

    /**
     * Request an specific action of the product
     * @param string $action method of the product
     * @param string $channel channel of your business
     * @param string $productId The id of the product
     * @param string $accessCode The access code of the product
     * @param string[] $data array list with data needed for the action
     * @return Object containing the response of the action
     * @throws \Exception
     */
    public function requestAction(
        $action = "request-product",
        $channel = "default",
        $productId = null,
        $accessCode = null,
        $data = array()
    ) {
        //Check crendentials and key
        if ($this->apiClient == null) {
            throw new \Exception("API client credentials have not been set.");
        }

        if ($this->apiKey == null || strlen($this->apiKey) != 32) {
            throw new \Exception("API key has not been set or is incorrect.");
        }

        $url = $this->protocol . '://' . $this->host . '/' . $this->apiEndpoint . '/product/' . $action;

        $epochTime = time();
        $requestData = array_merge([
            'X-123test-ProductId' => $productId,
            'X-123test-Channel'   => $channel,
            'X-123test-AccessCode'=> $accessCode,
            'timestamp' => $epochTime
        ], $data);

        $requestData = json_encode($requestData, JSON_FORCE_OBJECT);

        $requestData = $this->encrypt($requestData, $this->apiKey);

        $ch = curl_init($url);

        if ($this->debugMode) {
            curl_setopt($ch, CURLOPT_VERBOSE, true);
        }

        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, $this->verifySsl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HEADER, false);
        curl_setopt($ch, CURLINFO_HEADER_OUT, $this->debugMode);
        curl_setopt($ch, CURLOPT_HTTPHEADER, array(
            'Content-Type: application/json',
            'X-123test-Client-id: ' . $this->apiClient,
            'X-123test-Payload: ' . $requestData,
            'X-123test-Timestamp: ' . $epochTime,
        ));

        //Run the cURL request
        $result = curl_exec($ch);

        if ($this->debugMode && curl_errno($ch)) {
            throw new \Exception('cURL request contained an error: ' . curl_error($ch));
        }

        $jsonResult = json_decode($result);

        if (is_null($jsonResult)
            || ($action == "request-product"
                && (!isset($jsonResult->session)
                    || is_null($jsonResult->session)
                    || is_null($jsonResult->accessCode)))) {
            //Result is not valid, ouptut in debug mode and throw an exception
            if ($this->debugMode) {
                throw new \Exception("API Request failed with result " . print_r(array(
                        'result'  => $jsonResult,
                        'raw'     => $result
                    )));
            }

            throw new \Exception("API Request failed");
        }

        return $jsonResult;
    }

    /**
     * Encrypt string data
     * @param string $input - string data to encrypt
     * @param $key - private key
     * @return string - encrypted
     */
    private function encrypt($input, $key)
    {
        $block = mcrypt_get_block_size('rijndael_128', 'ecb');

        $pad = $block - (strlen($input) % $block);
        $input .= str_repeat(chr($pad), $pad);

        $res = mcrypt_encrypt(MCRYPT_RIJNDAEL_128, $key, $input, MCRYPT_MODE_ECB);

        return base64_encode($res);
    }

    /**
     * Decrypt a string using a key
     * @param $str
     * @param $key
     * @return string
     */
    private function decrypt($str, $key)
    {
        $str = mcrypt_decrypt(MCRYPT_RIJNDAEL_128, $key, base64_decode($str), MCRYPT_MODE_ECB);

        $len = strlen($str);
        $pad = ord($str[$len-1]);

        return substr($str, 0, strlen($str) - $pad);
    }
}
